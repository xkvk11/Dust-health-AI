import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DustDataContext } from '../context/DustDataContext';

const DustData = () => {
  const { setPastdustData, setTodaydustData, setFutureForecast } = useContext(DustDataContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 데이터 로드
        const dustResponse = await fetch('API_URL_FOR_DUST_DATA');
        const todayDustResponse = await fetch('API_URL_FOR_TODAY_DUST');
        const forecastResponse = await fetch('API_URL_FOR_FORECAST');

        const pastdustData = await dustResponse.json();
        const todaydustData = await todayDustResponse.json();
        const forecastData = await forecastResponse.json();

        // DustDataContext에 데이터 저장
        setPastdustData(pastdustData);
        setTodaydustData(todaydustData);
        setFutureForecast(forecastData);

        // Main으로 리다이렉션
        navigate('/main', { replace: true });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [navigate, setPastdustData, setTodaydustData, setFutureForecast]);

  return (
    <div style={{ textAlign: 'center', marginTop: '20%' }}>
      <h2>데이터 로딩 중...</h2>
    </div>
  );
};

export default DustData;