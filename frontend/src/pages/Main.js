import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/main.css';
import MenuIcon from '@mui/icons-material/Menu';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { PieChart } from '@mui/x-charts/PieChart';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import axios from 'axios';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { DustDataContext } from '../context/DustDataContext';

const API_KEY = process.env.REACT_APP_API_KEY;

  // 대기질 기준별 색상 및 임계값 설정
  const airQualityStandards = {
    PM10: {
      thresholds: [30, 80, 150],  // 좋음(~30), 보통(~80), 나쁨(~150), 매우나쁨(150+)
      colors: ['#fff', '#829ed7', '#74cba9', '#eed590', '#e08a8e']
    },
    PM25: {
      thresholds: [15, 35, 75],   // 좋음(~15), 보통(~35), 나쁨(~75), 매우나쁨(75+)
      colors: ['#fff', '#829ed7', '#74cba9', '#eed590', '#e08a8e']
    },
    O3: {
      thresholds: [0.03, 0.09, 0.15],  // 좋음(~0.03), 보통(~0.09), 나쁨(~0.15), 매우나쁨(0.15+)
      colors: ['#fff', '#829ed7', '#74cba9', '#eed590', '#e08a8e']
    }
  };
  
  // 값에 따른 색상 가져오기
  const getColorByPollutant = (value, pollutantType) => {
    if (!value || value === '-') return airQualityStandards[pollutantType].colors[0];
    
    const numericValue = parseFloat(value);
    const { thresholds, colors } = airQualityStandards[pollutantType];
    
    for (let i = 0; i < thresholds.length; i++) {
      if (numericValue <= thresholds[i]) return colors[i + 1];
    }
    return colors[colors.length - 1];
  };
  
  // 대기질 상태 텍스트 반환
  const getAirQualityStatus = (value, pollutantType) => {
    if (!value || value === '-') return '정보 없음';
    
    const numericValue = parseFloat(value);
    const { thresholds } = airQualityStandards[pollutantType];
    
    if (numericValue <= thresholds[0]) return '좋음';
    if (numericValue <= thresholds[1]) return '보통';
    if (numericValue <= thresholds[2]) return '나쁨';
    return '매우 나쁨';
  };


const Main = ({setIsAuthenticated}) => {
  const location = useLocation();
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");  
  const [userData,setUserData] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const {dustData: initialDustData = [], todayDust = []} = location.state || {}; // location에서 가져오는 dustData
  const [dustData, setDustData] = useState(initialDustData); // 상태를 초기화할 때 location에서 가져온 값을 사용
  const [dbData, setDbData] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [error, setError] = useState(null);

  const { pastdustData, futureForecast, futureprediction ,filteredPrediction } = useContext(DustDataContext);

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

  const fetchDetailData = async (fullRegion) => {
    try {
      const [mainRegion, subRegion] = fullRegion.split(' ');
      
      const response = await axios.get(
        `https://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureSidoLIst?sidoName=${mainRegion}&searchCondition=DAILY&pageNo=1&numOfRows=100&returnType=json&serviceKey=${API_KEY}`
      );
  
      const allItems = response.data.response.body.items;
      const filteredItems = allItems.filter(item => item.cityName === subRegion)
        .sort((a, b) => new Date(b.dataTime) - new Date(a.dataTime));
      
      return filteredItems;
    } catch (error) {
      console.error(`${fullRegion} 상세 데이터 가져오기 실패:, error`);
      return [];
    }
  };

  
  // AI response 가져오기
  const [analy, setAnaly]=useState('test');
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebarElement = document.querySelector('.sidebar');
      if (sidebarOpen && sidebarElement && !sidebarElement.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);
  
  const fetchDbData = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/app/info/', {
      withCredentials: true,
    });

    console.log("response.data.region 값:", response.data.region);

    if (!response.data.region) {
      console.warn("지역 정보가 없어 기본값(서울 강남구)을 설정합니다.");
      setCity("서울");
      setRegion("강남구");
    } else {
      const [mainRegion, subRegion] = response.data.region.split(' ');
      setCity(mainRegion || "서울");
      setRegion(subRegion || "강남구");
      console.log("분리된 지역 정보:", mainRegion, subRegion);
    }

    setUserData(response.data.disease || '');
    return response.data;
  } catch (error) {
    console.error('DB 데이터 가져오기 실패:', error);
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
          fetchDbData(),
        ]);

        setDustData(dustResult);
        setDbData(userDbData);

        if (userDbData && userDbData.region) {
          const detailData = await fetchDetailData(userDbData.region);
          setApiData([{ region: userDbData.region, apiData: detailData }]);

          setDustData(prevData => ({
            ...prevData,
            disease: userDbData.disease,
          }));

          fetch('http://127.0.0.1:8000/analyze/compact/'+detailData[0].pm10Value+'&'+userDbData.disease, {
            method: 'GET'
          })
          .then(res => res.json())
          .then(json => {
            setAnaly(json);
          })
          .catch(err => {
            console.log(err);
          });
          // console.log('미세먼지 수치:'+detailData[0].pm10Value);
          // console.log('보유 질병:'+userDbData.disease);
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
    }, []);

     // 미래 예보 함수
  const renderFuturePrediction = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // 내일 날짜 계산
    const tomorrowDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  
    if (filteredPrediction && filteredPrediction.future_dates && filteredPrediction.predictions) {
      return filteredPrediction.future_dates.map((date, index) => {
        const roundedPrediction = Math.round(filteredPrediction.predictions[index]);
  
        return (
          <div key={index} className="forecast-box">
            {/* 예측 날짜 */}
            <p className="pmText">{date}</p>
            <hr />
            {/* 이모지를 getEmoji 함수로 가져옴 */}
            <div className="emoji large-emoji">{getEmoji(roundedPrediction)}</div>
            <hr />
            {/* 예측 PM10 농도 */}
            <p className="pmStatus">{roundedPrediction} µg/m³</p>
          </div>
        );
      });
    } else if (futureForecast && futureForecast.dataTime && futureForecast.informGrade) {
      // fallback으로 futureForecast를 표시
      const grade = futureForecast.informGrade
        .split(',')
        .find(grade => grade.includes(city))
        ?.split(':')[1]
        ?.trim();
  
      return (
        <div className="forecast-box">
          {/* 내일 날짜를 pmText로 표시 */}
          <p className="pmText">{tomorrowDateStr}</p>
          <hr />
          {/* 이모지를 getEmoji 함수로 가져옴 */}
          <div className="emoji large-emoji">{getEmoji(grade)}</div>
          <hr />
          <p className="pmStatus">{grade || "정보 없음"}</p>
        </div>
      );
    }
    return <p>예측 데이터를 가져오는 중입니다...</p>;
  };
  
  const getEmoji = (pm10Value) => {
    if (pm10Value <= 30) return '😊';
    if (pm10Value === '좋음') return '😊';
    if (pm10Value <= 80) return '😐';
    if (pm10Value === '보통') return '😐';
    if (pm10Value <= 150) return '😷';
    if (pm10Value === '나쁨') return '😷';
    return '😡';
  };
  

  if (loading) return <div className="loading">로딩중...</div>;
  if (error) return <div className="error">에러: {error}</div>;

  const currentData = apiData[0]?.apiData[0];
  const pm10Status = getAirQualityStatus(currentData?.pm10Value, 'PM10');
  const pm25Status = getAirQualityStatus(currentData?.pm25Value, 'PM25');
  const O3Status = getAirQualityStatus(currentData?.o3Value, 'O3');


  return (<div className="app-container">
    <header className="header">
      <p className="menu-button" onClick={toggleSidebar}>
        <MenuIcon sx={{ fontSize: 25 }} className="header-button" />
      </p>
      <div className="location">
        {dbData && dbData.region ? dbData.region : "위치 정보 없음"}
      </div>
      <Link to={'/map'}>
        <LocationOnIcon sx={{ fontSize: 25 }} className="header-button" />
      </Link>
    </header>

    {sidebarOpen && (
      <aside className="sidebar">
        <p className="menu-button" onClick={toggleSidebar}>
          <MenuIcon sx={{ fontSize: 25 }} className="header-button" />
        </p>
        <ul>
          <li><Link to="/">홈</Link></li>
          <li><Link to="/mypage">마이페이지</Link></li>
          <li>
            <Link 
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
                document.cookie = document.cookie = `csrftoken=${data.data.csrftoken}; path=/;`;

                localStorage.clear();
              }}
            >
              로그아웃
            </Link>
          </li>
        </ul>
      </aside>
    )}

    <div className="main-container">
      <h1 className="title">내 위치 미세먼지 현황</h1>
      <p className="date">
        {new Date().toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          weekday: 'long' 
        })}
      </p>

      <Stack direction="row" width="100%" textAlign="center" spacing={2}>
        <section className="air-status">
          <Box flexGrow={1}>
            <div className="status-box">
              <CircularProgressbar
                value={parseFloat(currentData?.pm10Value) || 0}
                maxValue={200}
                text={`${currentData?.pm10Value || 'N/A'}㎍/m³`}
                styles={buildStyles({
                  pathColor: getColorByPollutant(currentData?.pm10Value, 'PM10'),
                  textColor: '#333',
                  trailColor: '#d6d6d6',
                })}
              />
              <p className='pmText'>미세먼지</p>
              <hr />
              <div className="emoji large-emoji">
                {
                  getEmoji(pm10Status)
                  // pm10Status === '좋음' || pm10Status === '보통' ? 
                  // <SentimentSatisfiedAltIcon sx={{ fontSize: 25, color: "#7f99b8" }} /> :
                  // <SentimentVeryDissatisfiedIcon sx={{ fontSize: 25, color: "#7f99b8" }} />
                }
              </div>
              {/* <hr /> */}
              <p className='pmStatus'>{pm10Status}</p>
            </div>
          </Box>
          <Box flexGrow={1}>
            <div className="status-box">
              <CircularProgressbar
                value={parseFloat(currentData?.pm25Value) || 0}
                maxValue={100}
                text={`${currentData?.pm25Value || 'N/A'}㎍/m³`}
                styles={buildStyles({
                  pathColor: getColorByPollutant(currentData?.pm25Value, 'PM25'),
                  textColor: '#333',
                  trailColor: '#d6d6d6',
                })}
              />
              <p className='pmText'>초미세먼지</p>
              <hr />
              <div className="emoji large-emoji">
                {
                  getEmoji(pm25Status)
                  // pm25Status === '좋음' || pm25Status === '보통' ? 
                  // <SentimentSatisfiedAltIcon sx={{ fontSize: 25, color: "#7f99b8" }} /> :
                  // <SentimentVeryDissatisfiedIcon sx={{ fontSize: 25, color: "#7f99b8" }} />
                }
              </div>
              {/* <hr /> */}
              <p className='pmStatus'>{pm25Status}</p>
            </div>
          </Box>
          <Box flexGrow={1}>
            <div className="status-box">
              <CircularProgressbar
                value={parseFloat(currentData?.o3Value) || 0}
                maxValue={100}
                text={`${currentData?.o3Value || 'N/A'}`}
                styles={buildStyles({
                  pathColor: getColorByPollutant(currentData?.o3Value, 'O3'),
                  textColor: '#333',
                  trailColor: '#d6d6d6',
                })}
              />
              <p className='pmText'>오존</p>
              <hr />
              <div className="emoji large-emoji">
                {
                  getEmoji(pm25Status)
                  // O3Status === '좋음' || O3Status === '보통' ? 
                  // <SentimentSatisfiedAltIcon sx={{ fontSize: 25, color: "#7f99b8" }} /> :
                  // <SentimentVeryDissatisfiedIcon sx={{ fontSize: 25, color: "#7f99b8" }} />
                }
              </div>
              {/* <hr /> */}
              <p className='pmStatus'>{O3Status}</p>
            </div>
          </Box>
        </section>
      </Stack>
      <div className="air-quality-legend">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#4C50AF' }}></div>
            <span>좋음</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#4CAF50' }}></div>
            <span>보통</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#FFF559' }}></div>
            <span>나쁨</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#F44336' }}></div>
            <span>매우 나쁨</span>
          </div>
        </div>
        {/* 내 행동 요령 */}
        <section className="guidance">
          <h3 className='guidance-title'>내 행동 요령<span class='ai-text'><AutoAwesomeIcon sx={{fontSize:15}}/> AI의 제안</span></h3>
          <p className='guidance-p'>
            {analy.response ? analy.response : "실외활동 시 특별히 행동에 제한 받을 필요 없지만 '민감군'의 경우 특별히 개인별 건강상태에 따라 유의하며 활동해야 합니다."}
          </p>
        </section>

        {/* 주간 예보 */}
        <section className="hourly-forecast">
          <h3>주간 예보</h3>

          <div className="forecast-scroll" ref={(el) => {
              if (el) {
              // 현재 데이터를 중앙에 보이게 스크롤 설정
              const currentElement = el.querySelector(".current-data-box");
              if (currentElement) {
                currentElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                  inline: "center",
                  });
                }
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              const container = e.currentTarget;
              let startX = e.pageX - container.offsetLeft;
              let scrollLeft = container.scrollLeft;

            const onMouseMove = (ev) => {
                const x = ev.pageX - container.offsetLeft;
                const walk = (x - startX) * 2; // Adjust scrolling speed
                container.scrollLeft = scrollLeft - walk;
            };

            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
            };

            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
          >
        
        {/* 과거 데이터 렌더링 */}
        {pastdustData.length > 0 ? (
          pastdustData.map((item, index) => {
            const dataTime = item?.msurDt || '날짜 없음';
            const pm10Value = item?.pm10Value || '데이터 없음';
            const pm10Status = getAirQualityStatus(pm10Value, "PM10");

            return (
              <div key={index} className="forecast-box"
              onClick={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                  inline: "center",
                });
              }}
              >
                <p className="pmText">{dataTime.split(' ')[0]}</p>
                <hr />
                <div className="emoji large-emoji">{getEmoji(pm10Value)}</div>
                <hr />
                <p className="pmStatus">{pm10Status}</p>
              </div>
            );
          })
        ) : (
          <p>데이터를 불러오는 중입니다...</p>
        )}

        {/* 현재 데이터 렌더링 */}
        {currentData && (
          <div className="forecast-box current-data-box"
          onClick={(e) => {
            e.currentTarget.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });
          }}
          >
            <p className="pmText">현재</p>
            <hr />
            <div className="emoji large-emoji">{getEmoji(currentData.pm10Value)}</div>
            <hr />
            <p className="pmStatus">{getAirQualityStatus(currentData.pm10Value, "PM10")}</p>
          </div>
        )}

        {/* 미래 예보 */}
        {renderFuturePrediction()}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Main;