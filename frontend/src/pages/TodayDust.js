import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import '../css/todaydust.css';
import cityMapping from '../region_mapping/cityMapping.js';
import cityCoordinates from '../region_mapping/cityPosition.js';

const API_KEY = process.env.REACT_APP_API_KEY;

// ZoomHandler 컴포넌트 - 줌 레벨 변경 감지
const ZoomHandler = ({ onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    map.on('zoomend', () => {
      onZoomChange(map.getZoom());
    });
  }, [map, onZoomChange]);

  return null;
};

const TodayDust = () => {
  const [dustData, setDustData] = useState(null);
  const [dbData, setDbData] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [currentZoom, setCurrentZoom] = useState(7);
  const [analy, setAnaly]=useState('test');
  
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

  const fetchDbData = async (userId) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/app/info/', {
        withCredentials: true  // 쿠키를 포함한 요청을 보내도록 설정
      });
      // console.log('DB Response:', response.data);
      
      if (!response.data.region || !response.data.disease) {
        throw new Error('필요한 데이터가 없습니다.');
      }
      return response.data;

    } catch (error) {
      console.error('DB 데이터 가져오기 실패:', error);
      throw error;
    }
  };

  const fetchDetailData = async (fullRegion) => {
    try {
      // 지역명을 공백을 기준으로 분리
      const [mainRegion, subRegion] = fullRegion.split(' ');
      
      // console.log('메인 지역:', mainRegion);
      // console.log('상세 지역:', subRegion);
  
      const response = await axios.get(
        `https://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureSidoLIst?sidoName=${mainRegion}&searchCondition=DAILY&pageNo=1&numOfRows=100&returnType=json&serviceKey=${API_KEY}`
      );
  
      const allItems = response.data.response.body.items;
      
      // subRegion과 일치하는 도시의 데이터만 필터링
      const filteredItems = allItems.filter(item => item.cityName === subRegion)
        .sort((a, b) => new Date(b.dataTime) - new Date(a.dataTime));
  
      // console.log('필터링된 데이터:', filteredItems);
      
      return filteredItems;
      
    } catch (error) {
      console.error(`${fullRegion} 상세 데이터 가져오기 실패:`, error);
      return [];
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const storedUserName = localStorage.getItem("user_name") || '';
    setUserName(storedUserName);

    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [dustResult, userDbData] = await Promise.all([
          fetchDustData(),
          fetchDbData(userId)
        ]);
    
        setDustData(dustResult);
        setDbData(userDbData);

    
        if (userDbData && userDbData.region) {
          const detailData = await fetchDetailData(userDbData.region);
          setApiData([{ 
            region: userDbData.region, 
            apiData: detailData 
          }]);
    
          setDustData(prevData => ({
            ...prevData,
            disease: userDbData.disease,
          }));
        
          // AI Response 가져오기 
          fetch('http://127.0.0.1:8000/analyze/compact/'+detailData[0].pm10Value+'&'+userDbData.disease,{
            method:'GET'
            }
            )
            .then(res=>res.json())
            .then(json=>{setAnaly(json);
                console.log(json)
            })
            .catch(err=>{
                console.log(err);})
          
          console.log("미세먼지 수치:"+JSON.stringify(detailData[0].pm10Value));
          console.log("보유 질병병:"+userDbData.disease);

          // console.log('Dust Result : '+ apiData,dustData);
          
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAllData();
    }
  }, []);
  
  // 값에 따른 색상 가져오기
  const getColorByValue = (value, thresholds, colors) => {
    if (!value || value === '-') return colors[0];
    const numericValue = parseFloat(value);
    for (let i = 0; i < thresholds.length; i++) {
      if (numericValue <= thresholds[i]) return colors[i + 1];
    }
    return colors[colors.length - 1];
  };

   // 마커 스타일 가져오기
   const getMarkerStyle = (value, zoomLevel) => {
    const thresholds = [30, 80, 150];
    const colors = [
      'rgba(128, 128, 128, 0.7)',
      'rgba(76, 80, 175, 0.7)',
      'rgba(76, 175, 80, 0.7)',
      'rgba(255, 245, 89, 0.7)',
      'rgba(244, 67, 54, 0.7)'
    ];

    const backgroundColor = getColorByValue(value, thresholds, colors);
    
    // 기본 크기 설정
    const baseSize = [30, 32.5, 35, 37.5][thresholds.findIndex(threshold => parseFloat(value) <= threshold) + 1] || 50;
    
    // 줌 레벨에 따른 크기 조정
    const zoomFactor = Math.max(0.8, (zoomLevel - 5) / 2);
    const size = baseSize * zoomFactor;

    // 폰트 크기도 줌 레벨에 따라 조정
    const fontSize = Math.max(8, Math.min(16, 12 * zoomFactor));

    return {
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor,
      borderRadius: '5px',
      border: '2px solid #333',
      fontSize: `${fontSize}px`
    };
  };


  // 로딩 및 에러 상태 처리
  if (loading) return <div className="loading">로딩중...</div>;
  if (error) return <div className="error">에러: {error}</div>;
  if (!dustData) return <div>데이터를 불러올 수 없습니다. 다시 시도해주세요.</div>;

  // 도시 데이터 필터링
  const cities = Object.entries(dustData).filter(
    ([key]) => key !== 'dataTime' && key !== 'dataGubun' && key !== 'itemCode'
  );

  // 컴포넌트 렌더링
  return (
    <>
      <div className="dust-container" >
        {/* API 데이터 섹션 */}
        <div className="api-data-section">
  <ul className="api-data-list">
    {apiData.map((data) => (
      <li key={data.region} className="api-data-item">
        <h3>
          <span className="region-name">{data.region}</span> 대기질 정보
        </h3>
        {data.apiData.length === 0 ? (
          <p>해당 지역의 데이터가 없습니다.</p>
        ) : (
          // 첫 번째 데이터만 사용하도록 수정
          <div className="measurement-info">
            <div className="gauge-container">
              {[
                { value: data.apiData[0].pm10Value, label: 'PM10(미세먼지)', max: 150 },
                { value: data.apiData[0].pm25Value, label: 'PM2.5(초미세먼지)', max: 150 },
                { value: data.apiData[0].o3Value, label: 'O3(오존)', max: 1 }
              ].map(({ value, label, max }) => (
                <div key={label} className="gauge">
                  <CircularProgressbar
                    value={parseFloat(value) || 0}
                    maxValue={max}
                    text={value ? `${value}${label === 'O3(오존)' ? 'ppm' : '㎍/m³'}` : 'N/A'}
                    styles={buildStyles({
                      pathColor: getColorByValue(value, [15, 50, 100], ['rgba(128, 128, 128, 0.7)', 'rgba(76, 80, 175, 0.7)', 'rgba(76, 175, 80, 0.7)', 'rgba(244, 67, 54, 0.7)']),
                      textColor: '#333',
                    })}
                  />
                  <p>{label}</p>
                </div> 
              ))}
            </div>
            <ul>
              <li>
                <span style={{ backgroundColor: 'rgba(76, 80, 175, 0.7)' }}></span> : 좋음
              </li>
              <li>
                <span style={{ backgroundColor: 'rgba(76, 175, 80, 0.7)' }}></span> : 보통
              </li>
              <li>
                <span style={{ backgroundColor: 'rgba(255, 245, 89, 0.7)' }}></span> : 나쁨
              </li>
              <li>
                <span style={{ backgroundColor: 'rgba(244, 67, 54, 0.7)' }}></span> : 매우 나쁨
              </li>
            </ul>
          </div>
        )}
      </li>
    ))}
  </ul>
</div>
<div>
  <Link to="/dustdata">
    <button>상세 정보 보기</button>
  </Link>
</div>

        {/* 질병 정보 박스 */}
        {dustData?.disease && (
          <div className="disease-box">
            <h3 className="disease-title">
              <span className="disease-highlight">{dustData.disease}</span> 환자를 위한 미세먼지 대처 요령
            </h3>
            <p>{analy.response}</p>
            <div className="disease-content">
              <p className="dust-status">
                <span className="user-name">{userName}</span> 현재 지역 미세먼지 농도는{' '}
                <span 
                  className="dust-value"
                  style={{ 
                    color: (() => {
                      const value = apiData[0]?.apiData[0]?.pm10Value;
                      if (!value) return '#666';
                      const numValue = parseFloat(value);
                      if (numValue <= 30) return '#4C50AF';
                      if (numValue <= 80) return '#4CAF50';
                      if (numValue <= 150) return '#FFF559';
                      return '#F44336';
                    })()
                  }}
                >
                  {apiData[0]?.apiData[0]?.pm10Value ? 
                    `${apiData[0].apiData[0].pm10Value}㎍/m³` : 
                    '측정불가'
                  }
                </span>
                {' '}으로,{' '}
                <span className="dust-level">
                  {(() => {
                    const value = apiData[0]?.apiData[0]?.pm10Value;
                    if (!value) return '측정불가';
                    const numValue = parseFloat(value);
                    if (numValue <= 30) return '좋음';
                    if (numValue <= 80) return '보통';
                    if (numValue <= 150) return '나쁨';
                    return '매우 나쁨';
                  })()}
                </span>
                {' '}수준입니다.
              </p>
              <Link to="/dustdata" className="analyze-button">
                AI 분석 결과 보기
              </Link>
            </div>
          </div>
        )}
        {/* 지도 컨테이너 */}
        <MapContainer
          center={[36.3, 128.5]}
          zoom={7}
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
                ">
                  <span style="color: #000; font-weight: bold;">${cityMapping[city]}</span>
                </div>
              `,
            });

            return (
              <Marker key={city} position={coordinates} icon={icon}>
                <Popup>
                  <div style={{ textAlign: 'center', fontFamily: 'Roboto, sans-serif', color: '#333' }}>
                  <Link 
                      to="/usernowdata"
                      state={{ city: cityMapping[city] }}
                      style={{ 
                        fontSize: '16px', 
                        color: '#007bff', 
                        textDecoration: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      {cityMapping[city]}
                    </Link> <br />
                    미세먼지(PM10): <span style={{ fontWeight: 'bold' }}>{value}㎍/m³</span> <br />
                    상태: 
                
                    <span style={{ fontWeight: 'bold' }}>
                      {parseFloat(value) <= 30 ? '좋음' :
                       parseFloat(value) <= 80 ? '보통' :
                       parseFloat(value) <= 150 ? '나쁨' : '매우 나쁨'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* 범례 */}
        <ul>
          <li>
            <span style={{ backgroundColor: 'rgba(76, 80, 175, 0.7)' }}></span>(0~30) : 좋음
          </li>
          <li>
            <span style={{ backgroundColor: 'rgba(76, 175, 80, 0.7)' }}></span>(~80) : 보통
          </li>
          <li>
            <span style={{ backgroundColor: 'rgba(255, 245, 89, 0.7)' }}></span>(~150) : 나쁨
          </li>
          <li>
            <span style={{ backgroundColor: 'rgba(244, 67, 54, 0.7)' }}></span>(150+) : 매우 나쁨
          </li>
        </ul>
      </div>
      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2024 DustAI. All rights reserved.</p>
          <p>Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </>
  );
};

export default TodayDust;