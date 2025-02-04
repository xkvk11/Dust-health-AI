import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/map.css';
import MenuIcon from '@mui/icons-material/Menu';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { PieChart } from '@mui/x-charts/PieChart';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import cityMapping from '../region_mapping/cityMapping.js';
import cityCoordinates from '../region_mapping/cityPosition.js';
import MarkerClusterGroup from 'react-leaflet-cluster'

const API_KEY = process.env.REACT_APP_API_KEY;

const airQualityStandards = {
    PM10: {
      thresholds: [30, 80, 150],  // 좋음(~30), 보통(~80), 나쁨(~150), 매우나쁨(150+)
      colors: ['#gray', '#4C50AF', '#4CAF50', '#FFF559', '#F44336']
    },
    PM25: {
      thresholds: [15, 35, 75],   // 좋음(~15), 보통(~35), 나쁨(~75), 매우나쁨(75+)
      colors: ['#gray', '#4C50AF', '#4CAF50', '#FFF559', '#F44336']
    },
    O3: {
      thresholds: [0.03, 0.09, 0.15],  // 좋음(~0.03), 보통(~0.09), 나쁨(~0.15), 매우나쁨(0.15+)
      colors: ['#gray', '#4C50AF', '#4CAF50', '#FFF559', '#F44336']
    }
  };

const ZoomHandler = ({ onZoomChange }) => {
    const map = useMap();
  
    useEffect(() => {
      map.on('zoomend', () => {
        onZoomChange(map.getZoom());
      });
    }, [map, onZoomChange]);
  
    return null;
  };
  const getColorByPollutant = (value, pollutantType) => {
    if (!value || value === '-') return airQualityStandards[pollutantType].colors[0];
    
    const numericValue = parseFloat(value);
    const { thresholds, colors } = airQualityStandards[pollutantType];
    
    for (let i = 0; i < thresholds.length; i++) {
      if (numericValue <= thresholds[i]) return colors[i + 1];
    }
    return colors[colors.length - 1];
  };


const Map = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dustData, setDustData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(7);

  const [region, setRegion] = useState('위치 정보 없음');
  const [dbData, setDbData] = useState(null);

    const getMarkerStyle = (value, zoomLevel) => {
      const backgroundColor = getColorByPollutant(value, 'PM10');
      
      // 기본 크기 설정 (가로를 세로보다 길게)
      const baseHeight = [22.5, 25, 27.5, 30][airQualityStandards.PM10.thresholds.findIndex(threshold => 
      parseFloat(value) <= threshold) + 1] || 30;
      const baseWidth = baseHeight * 1.8; // 가로 길이를 세로의 2배로 설정
      
      const zoomFactor = Math.max(0.8, (zoomLevel - 5) / 2);
      const height = baseHeight * zoomFactor;
      const width = baseWidth * zoomFactor;
      const fontSize = Math.max(9, Math.min(12, 10 * zoomFactor));

      return {
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor,
          borderRadius: '5px',
          border: '2px solid #333',
          fontSize: `${fontSize}px`
      };
  };

    const fetchDbData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/app/info/', {
          withCredentials: true,
        });
        
        if (response.data.region) {
          setRegion(response.data.region);
        }
        return response.data;
      } catch (error) {
        console.error('DB 데이터 가져오기 실패:', error);
        setRegion('위치 정보 없음');
      }
    };

  const fetchDustData = async () => {
    try {
      const response = await fetch(
        `https://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureLIst?itemCode=PM10&dataGubun=HOUR&pageNo=1&numOfRows=1&returnType=json&serviceKey=${API_KEY}`
      );
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      return data.response.body.items[0];
    } catch (error) {
      console.error('미세먼지 데이터 가져오기 실패:', error);
      throw error;
    }
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }



    // 로그인 상태 확인
    useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/check-auth/`, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCookie('csrftoken'),
            },
            credentials: "include", // 세션 쿠키를 자동으로 포함
          });
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
            localStorage.clear();
          }
        } catch (error) {
          console.error("Error checking authentication:", error);
          setIsAuthenticated(false);
        }
      };
  
      checkAuth();

      const fetchData = async () => {
        try {
          const response = await fetch(
            `https://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureLIst?itemCode=PM10&dataGubun=HOUR&pageNo=1&numOfRows=1&returnType=json&serviceKey=${API_KEY}`
          );
          const data = await response.json();
          setDustData(data.response.body.items[0]);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setLoading(false);
        }
      };

      fetchData();

      const initializeData = async () => {
        await checkAuth();
        const dbData = await fetchDbData();
        // fetchDustData도 호출
        const dustData = await fetchData();
      };
    
      initializeData();
    }, []);

    if (loading) {
        return <div className="loading">Loading...</div>;
      }
    
      if (!dustData || dustData.length === 0) {
        return <div>데이터를 불러올 수 없습니다. 다시 시도해주세요.</div>;
      }
    
      const cities = Object.entries(dustData).filter(
        ([key]) => key !== 'dataTime' && key !== 'dataGubun' && key !== 'itemCode'
      );
    
      // PM10 수치에 따라 색상을 반환하는 함수
      const getColorByPM10 = (value) => {
        if (!value || value === '-') return 'rgba(128, 128, 128, 0.7)';
        const pmValue = parseFloat(value);
        if (pmValue <= 30) return '#4C50AF';
        if (pmValue <= 80) return '#4CAF50';
        if (pmValue <= 150) return '#FFF559';
        return '#F44336';
      };
    
      // PM10 수치에 따라 사각형 마커의 스타일과 지역명을 반환하는 함수
      const getMarkerStyleByPM10 = (value) => {
        if (!value || value === '-') return {
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(128, 128, 128, 0.7)',
        };
    
        const pmValue = parseFloat(value);
        
        // PM10 수치에 따라 크기를 단계별로 설정
        let size = 30; // 기본값
        if (pmValue > 15 && pmValue <= 35) size = 35;
        else if (pmValue > 35 && pmValue <= 75) size = 40;
        else if (pmValue > 75 && pmValue <= 150) size = 45;
        else if (pmValue > 150) size = 50;
    
        return {
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: getColorByPM10(value),
          borderRadius: '5px', // 사각형 모양
          border: '1px solid #333',
          fontSize: '14px', // 한글 지역명에 맞게 폰트 크기 조정
          fontWeight: 'bold',
        };
      };

  return (
    <div className="app-container">
      <header className="header">
        <p className="menu-button" onClick={toggleSidebar}>
          <MenuIcon sx={{ fontSize: 25 }} className="header-button" />
        </p>
        <div className="location">
          {region || '위치 정보 없음'}
        </div>
        <Link to={'/map'}>
          <LocationOnIcon sx={{ fontSize: 25 }} className="header-button" />
        </Link>
      </header>

      {sidebarOpen && (
        <aside className="sidebar">
          <p className="menu-button" onClick={toggleSidebar}><MenuIcon sx={{ fontSize: 25 }} className="header-button" /></p>
          <ul>
            <li><Link to="/">홈</Link></li>
            <li><Link to="/mypage">마이페이지</Link></li>
            <li><Link 
                  onClick={async () => {
                    const logoutResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/logout/`, {
                      method: "POST",
                      headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                      },
                      credentials: "include",
                    });
                    setIsAuthenticated(false);
                    const data = await logoutResponse.json();
                    document.cookie = `csrftoken=${data.data.csrftoken}; path=/;`;
                    localStorage.clear();
                }}
                >
                로그아웃</Link></li>
          </ul>
        </aside>
      )}

      <div className="main-container">

      <MapContainer
          
          center={[36.3, 127.9]}
          zoom={7}
          minZoom={6} // 최소 줌 설정
          scrollWheelZoom={true}
          doubleClickZoom={false}
          className="map-container"
        >
          <ZoomHandler onZoomChange={setCurrentZoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {cities.map(([city, value]) => {
            const coordinates = cityCoordinates[cityMapping[city]];
            if (!coordinates) return null;

            const markerStyle = getMarkerStyle(value, currentZoom);
            const icon = L.divIcon({
                className: 'custom-icon',
                html: `
                    <div style="
                        width:${markerStyle.width}; 
                        height:${markerStyle.height}; 
                        background-color:${markerStyle.backgroundColor}; 
                        border-radius:${markerStyle.borderRadius}; 
                        border:${markerStyle.border}; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center;
                        font-size: ${markerStyle.fontSize};
                        white-space: nowrap;
                        padding: 0 8px;
                    ">
                        <span style="color: #000; font-weight: bold;">
                            ${cityMapping[city]} | ${value}
                        </span>
                    </div>
                `,
            });

            return (
              <Marker key={city} position={coordinates} icon={icon}>
                
              </Marker>
            );
          })}
        </MapContainer>
        <ul style={{ display: 'flex', flexWrap: 'wrap' }}>
            <li style={{ width: '45%' }}>
                <span style={{ backgroundColor: '#4C50AF' }}></span>(0~30) : 좋음
            </li>
            <li style={{ width: '45%' }}>
                <span style={{ backgroundColor: '#4CAF50' }}></span>(~80) : 보통
            </li>
            <li style={{ width: '45%' }}>
                <span style={{ backgroundColor: '#FFF559' }}></span>(~150) : 나쁨
            </li>
            <li style={{ width: '45%' }}>
                <span style={{ backgroundColor: '#F44336' }}></span>(150+) : 매우 나쁨
            </li>
        </ul>
      </div>
    </div>
  );
};

export default Map;