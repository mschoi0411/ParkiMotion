import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Line, Scatter } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


import femaleProfile from "../image/girl_image.jpg";
import maleProfile from "../image/boy_image.jpg";


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

function Dashboard({ token }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPatientId = location.state?.patientId || '';
  const [patientId, setPatientId] = useState(initialPatientId);
  

  const [patientData, setPatientData] = useState(null);

  const [walkingData, setWalkingData] = useState([]);
  const [walkingIndex, setwalkingIndex] = useState(1); // 기본값을 1로 설정 (2번째 데이터부터 표시)
  
  const [fingerData, setFingerData] = useState([]);
  const [fingerIndex, setFingerIndex] = useState(1);
  const [selectedHand, setSelectedHand] = useState('L'); // 'L' for left, 'R' for right

  const [blinkData, setBlinkData] = useState([]); // 눈 깜빡임 데이터 상태 변수
  const [blinkIndex, setBlinkIndex] = useState(0); // 추가: blinkIndex state 추가
  const [dataLimit, setDataLimit] = useState(20); // 데이터 개수 제한 state 추가
  const [tempDataLimit, setTempDataLimit] = useState(20);
  const [appliedDataLimit, setAppliedDataLimit] = useState(20);
  //발성
  const vocalExercises = [
    { name: '지속 발성 (A Sound)', endpoint: '/a-sound' },
    { name: '지속 발성 (E Sound)', endpoint: '/e-sound' },
    { name: '반복 발성 (Dadada)', endpoint: '/dadada' },
    { name: '반복 발성 (Pataka)', endpoint: '/pataka' },
  ];

  useEffect(() => {
    if (!token) {
      alert('인증이 필요합니다.');
      navigate('/');
      return;
    }

    if (!patientId) {
      // setPatientData(null);
      // setWalkingData([]);
      // setFingerData([]);
      // setBlinkData([]);
      return;
    }

    const fetchData = async () => {
      try {
        //환자 데이터 가져오기
        const patientResponse = await fetch(`https://kwhcclab.com:20757/api/users/${patientId}`, {
          headers: { 'X-Auth-Token': token },
        });
        const patient = await patientResponse.json();
        setPatientData(patient);

        // 걷기 데이터 가져오기
        const walkingResponse = await fetch(`https://kwhcclab.com:20757/api/tests/gait?userId=${patientId}&size=${appliedDataLimit}`, {
          headers: { 'X-Auth-Token': token },
        });
        const walkingData = await walkingResponse.json();

        // 속도 계산 추가
        const processedWalkingData = walkingData.data.map((item) => ({
          ...item,
          speed: item.distance / item.time, // 속도 계산
        }));

        setWalkingData(processedWalkingData || []);

        // 손 터치 데이터 가져오기
        const fingerResponse = await fetch(`https://kwhcclab.com:20757/api/tests/finger?userId=${patientId}&size=${appliedDataLimit}`, {
          headers: { 'X-Auth-Token': token },
        });
        const fingerData = await fingerResponse.json();
        setFingerData(fingerData.data || []);

        // 눈 깜빡임 데이터 가져오기
        const blinkResponse = await fetch(`https://kwhcclab.com:20757/api/tests/quick-blink?userId=${patientId}&size=${appliedDataLimit}`, {
          headers: { 'X-Auth-Token': token },
        });
        const blinkData = await blinkResponse.json();
        setBlinkData(blinkData.data || []);
      } catch (error) {
        console.error('데이터를 가져오는 중 오류:', error);
        alert('데이터를 가져오는 중 오류가 발생했습니다.');
      }
    };

    fetchData();
  }, [patientId, token, appliedDataLimit, navigate]);


  // 사이드 바 환자 정보 검색
  const handleDashboardClick = () => {
    if (patientData) {
      navigate('/dashboard', { state: { patientId, patientData } });
    } else {
      alert('먼저 환자 정보를 검색해주세요.');
    }
  };


  const calculateChange = (current, previous, field) => {
    const difference = current[field] - previous[field];
    let percentage = previous[field] !== 0
    ? ((difference / previous[field]) * 100).toFixed(2)
    : 0; // 이전 값이 0이면 0% 반환
    percentage = Math.min(percentage, 100);
    return { difference, percentage };
  };

  const handleFirst = () => setwalkingIndex(1);
  const handleLast = () => setwalkingIndex(walkingData.length - 1);
  const handleNext = () => {
    if (walkingIndex < walkingData.length - 1) {
      setwalkingIndex(walkingIndex + 1);
    }
  };
  const handlePrevious = () => {
    if (walkingIndex > 1) {
      setwalkingIndex(walkingIndex - 1);
    }
  };

  const current = walkingData[walkingIndex];
  const previous = walkingIndex > 0 ? walkingData[walkingIndex - 1] : null;

  const stepChange = previous
    ? calculateChange(current, previous, 'step')
    : { difference: 0, percentage: 0 };

  const speedChange = previous
    ? calculateChange(current, previous, 'speed')
    : { difference: 0, percentage: 0 };

  //발성
  const handleDownload = async (endpoint, exerciseName) => {
    if (!token || !patientId) {
      alert('인증이 필요합니다.');
      return;
    }
  
    try {
      const response = await fetch(`https://kwhcclab.com:20757/api/tests${endpoint}?userId=${patientId}`, {
        headers: { 'X-Auth-Token': token },
      });

      if (!response.ok) {
        throw new Error('데이터를 가져오는 데 실패했습니다.');
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
  
      // 다운로드 링크 생성
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exerciseName}_data_${patientId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  
      alert(`${exerciseName} 데이터를 다운로드했습니다.`);
    } catch (error) {
      console.error(`${exerciseName} 다운로드 오류:`, error);
      alert(`${exerciseName} 데이터를 다운로드하는 중 오류가 발생했습니다.`);
    }
  };

  // 화면 응시 데이터 다운로드 함수
  const handleScreenGazeDownload = async () => {
    if (!token || !patientId) {
      alert('인증이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`https://kwhcclab.com:20757/api/tests/screen-gaze?userId=${patientId}`, {
        headers: { 'X-Auth-Token': token },
      });

      if (!response.ok) {
        throw new Error('데이터를 가져오는 데 실패했습니다.');
      }

      const data = await response.json();
      
      // CSV 데이터 생성
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Count,Time After Taking Medicine,Created At,User ID\n";
      
      data.data.forEach(item => {
        csvContent += `${item.id},${item.count},${item.timeAfterTakingMedicine},${item.createdAt},${item.userId}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `screen_gaze_data_${patientId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('화면 응시 데이터를 다운로드했습니다.');
    } catch (error) {
      console.error('화면 응시 데이터 다운로드 오류:', error);
      alert('화면 응시 데이터를 다운로드하는 중 오류가 발생했습니다.');
    }
  };

  // 왼손 및 오른손 평균 계산
  const leftHandAverage =
    fingerData
      .filter((item) => item.hand === 'L')
      .reduce((sum, item) => sum + item.count, 0) /
    fingerData.filter((item) => item.hand === 'L').length || 0;

  const rightHandAverage =
    fingerData
      .filter((item) => item.hand === 'R')
      .reduce((sum, item) => sum + item.count, 0) /
    fingerData.filter((item) => item.hand === 'R').length || 0;

    const calculateFingerChange = (currentData, averageCount) => {
      if (!currentData || typeof averageCount !== 'number' || isNaN(averageCount)) {
        return { difference: 0, percentage: 0 };
      }
  
      // 현재 선택된 손에 해당하는 데이터 찾기
      const currentHandData = fingerData
        .filter(item => item.hand === selectedHand)
        [fingerIndex];
  
      if (!currentHandData) {
        return { difference: 0, percentage: 0 };
      }
  
      const currentCount = currentHandData.count;
      
      // 현재 값이 유효하지 않은 경우
      if (typeof currentCount !== 'number' || isNaN(currentCount)) {
        return { difference: 0, percentage: 0 };
      }
  
      const difference = currentCount - averageCount;
      
      // 평균이 0인 경우 특별 처리
      if (averageCount === 0) {
        return {
          difference,
          percentage: currentCount > 0 ? 100 : 0
        };
      }
  
      const percentage = ((difference / averageCount) * 100).toFixed(2);
      
      // NaN 체크 및 범위 제한
      return {
        difference,
        percentage: isNaN(percentage) ? 0 : Math.min(Math.max(parseFloat(percentage), -100), 100)
      };
    };
  
  const handleFingerFirst = () => setFingerIndex(0);
  const handleFingerLast = () => setFingerIndex(fingerData.filter(d => d.hand === selectedHand).length - 1);
  const handleFingerNext = () => {
    setFingerIndex(prev => Math.min(fingerData.filter(d => d.hand === selectedHand).length - 1, prev + 1));
  };
  const handleFingerPrevious = () => {
    setFingerIndex(prev => Math.max(0, prev - 1));
  };

  const toggleSelectedHand = () => {
    setSelectedHand(prev => prev === 'L' ? 'R' : 'L');
  };
  
    // 평균 터치 횟수 계산 함수 개선
  const calculateAverageTouchCount = (data, hand) => {
    if (!Array.isArray(data) || data.length === 0) return 0;

    const handData = data.filter(item => item.hand === hand);
    
    if (handData.length === 0) return 0;

    const validData = handData.filter(item => 
      typeof item.count === 'number' && !isNaN(item.count)
    );

    if (validData.length === 0) return 0;

    const sum = validData.reduce((acc, item) => acc + item.count, 0);
    return sum / validData.length;
  };

  // 현재 선택된 손의 데이터 가져오기
  const getCurrentFingerData = () => {
    const handData = fingerData.filter(item => item.hand === selectedHand);
    return handData[fingerIndex] || null;
  };

  const currentFinger = getCurrentFingerData();
  const averageTouchCount = calculateAverageTouchCount(fingerData, selectedHand);
  const change = calculateFingerChange(currentFinger, averageTouchCount);
    
  
  
  const calculateBlinkChange = (currentData, averageCount) => {
    if (!currentData || typeof averageCount !== 'number' || isNaN(averageCount)) {
      return { difference: 0, percentage: 0 };
    }

    const currentCount = currentData.count;
    
    // 현재 값이 유효하지 않은 경우
    if (typeof currentCount !== 'number' || isNaN(currentCount)) {
      return { difference: 0, percentage: 0 };
    }

    const difference = currentCount - averageCount;
    
    // 평균이 0인 경우 특별 처리
    if (averageCount === 0) {
      return {
        difference,
        percentage: currentCount > 0 ? 100 : 0
      };
    }

    const percentage = ((difference / averageCount) * 100).toFixed(2);
    
    // NaN 체크 및 범위 제한
    return {
      difference,
      percentage: isNaN(percentage) ? 0 : Math.min(Math.max(parseFloat(percentage), -100), 100)
    };
  };

  // 평균 눈 깜빡임 횟수 계산
  const calculateAverageBlinkCount = (data) => {
    if (!Array.isArray(data) || data.length === 0) return 0;

    const validData = data.filter(item => 
      typeof item.count === 'number' && !isNaN(item.count)
    );

    if (validData.length === 0) return 0;

    const sum = validData.reduce((acc, item) => acc + item.count, 0);
    return sum / validData.length;
  };

  // 현재 눈 깜빡임 데이터 가져오기
  const getCurrentBlinkData = () => {
    return blinkData[blinkIndex] || null;
  };

  const handleBlinkFirst = () => setBlinkIndex(0);
  const handleBlinkLast = () => setBlinkIndex(blinkData.length - 1);
  const handleBlinkNext = () => {
    setBlinkIndex(prev => Math.min(blinkData.length - 1, prev + 1));
  };
  const handleBlinkPrevious = () => {
    setBlinkIndex(prev => Math.max(0, prev - 1));
  };

  const averageBlinkCount = calculateAverageBlinkCount(blinkData);
  const blinkChange = calculateBlinkChange(getCurrentBlinkData(), averageBlinkCount);

  const handleApplyDataLimit = () => {
    setAppliedDataLimit(tempDataLimit);
  };

  const processBlinkDataForCalendarHeatmap = () => {
    const groupedData = blinkData.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][month]) {
        acc[year][month] = {
          count: 0,
          total: 0
        };
      }
      
      acc[year][month].count++;
      acc[year][month].total += item.count;
      
      return acc;
    }, {});
  
    const years = Object.keys(groupedData).sort((a, b) => Number(b) - Number(a));
    const months = Array.from({ length: 12 }, (_, i) => i);
    
    return years.map(year => ({
      year: Number(year),
      months: months.map(month => {
        const data = groupedData[year]?.[month];
        return {
          value: data ? Math.round(data.total / data.count) : null,
          month: month
        };
      })
    }));
  };

  const BlinkHeatmap = () => {
    const data = processBlinkDataForCalendarHeatmap();
    const maxValue = Math.max(
      ...data.flatMap(year => 
        year.months.map(month => month.value)
      )
    );

    const getColorIntensity = (value) => {
      if (value === null) return '#f3f4f6'; // 데이터 없는 경우 밝은 회색
      if (value === 0) return '#eac6ff'; // 평균이 0인 경우 조금 더 진한 회색
      const intensity = value / maxValue;
      // 보라색 계열의 그라데이션
      return `rgba(88, 24, 69, ${0.2 + (intensity * 0.8)})`;
    };

    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                       '7월', '8월', '9월', '10월', '11월', '12월'];

                       return (
                        // <div className="blink-chart">
                          <div className="chart-container">
                          <div className="heatmap-header">
                            <h2>눈 깜빡임 월별 히트맵</h2>
                            <div className="heatmap-legend">
                              <span className="legend-label">적음</span>
                              <div className="legend-gradient"></div>
                              <span className="legend-label">많음</span>
                            </div>
                          </div>
                          <div className="calendar-heatmap">
                            <div className="month-labels">
                              {monthNames.map(month => (
                                <div key={month} className="month-label">{month}</div>
                              ))}
                            </div>
                            <div className="heatmap-grid">
                              {data.map(yearData => (
                                <div key={yearData.year} className="year-row">
                                  <div className="year-label">{yearData.year}년</div>
                                  <div className="month-cells">
                                    {yearData.months.map(month => (
                                      <div
                                        key={month.month}
                                        className={`heatmap-cell ${month.value === null ? 'no-data' : ''}`}
                                        style={{
                                          backgroundColor: getColorIntensity(month.value)
                                        }}
                                      >
                                        <div className="cell-tooltip">
                                          <strong>{yearData.year}년 {month.month + 1}월</strong>
                                          <br />
                                          {month.value === null ? '데이터 없음' : `평균 ${month.value}회`}
                                        </div>
                                        <span className="cell-value">
                                          {month.value === null ? '-' : month.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
  };

  

  return (
    <div className="dashboard-container">
      {/* 사이드 바 */}
      <div className="sidebar">
        <h2 id="name">환자 정보검색</h2>
        <div className="search-container1">
          <input
            type="text"
            placeholder="환자 ID를 입력해주세요"
            className="search-input1"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          />
          {/* <button className="search-button" onClick={handleDashboardClick}>
            <span role="img" aria-label="search">🔍</span>
          </button> */}
        </div>
        {patientData ? (
          <div id="info">
            <h2>환자 정보</h2>
            <div className="profile-image-container">
              <img 
                src={patientData.gender === 'M' ? maleProfile : femaleProfile}
                alt="Profile"
                className="profile-image"
              />
            </div>
            <p><strong>ID:</strong> {patientData.id}</p>
            <p><strong>이름:</strong> {patientData.name}</p>
            <p><strong>성별:</strong> {patientData.gender === 'M' ? '남성' : '여성'}</p>
            <p><strong>생년월일:</strong> {patientData.birthdate}</p>
            <p><strong>진단 연도:</strong> {patientData.diagnosis}</p>
          </div>
        ) : (
          <p>환자 정보를 불러오는 중...</p>
        )}

        {/* 데이터 개수 설정 입력 필드 추가 */}
        <div className="data-limit-container">
          <h2>데이터 설정</h2>
          <div id="info">
          <label htmlFor="dataLimit">데이터 크기:</label>
          <input
            type="number"
            id="dataLimit"
            value={tempDataLimit}
            onChange={(e) => setTempDataLimit(Math.max(1, parseInt(e.target.value)))}
            min="10"
          />
          <button onClick={handleApplyDataLimit} className="apply-button">적용</button>
        </div>
        </div>
        {/* 발성 운동 데이터 다운로드 */}
        <div className="vocal-exercises">
        <h2>발성 운동 데이터 다운</h2>
        <div id="down">
        {vocalExercises.map((exercise) => (
          <button id='btn-down' key={exercise.endpoint} onClick={() => handleDownload(exercise.endpoint, exercise.name)}>
            {exercise.name}
          </button>
        ))}
        </div>
        <h2>화면 응시 데이터</h2>
        <div id="info">
          <button id='btn-down-see' onClick={handleScreenGazeDownload}>화면 응시 (CSV)</button>
        </div>
        </div>

      </div>
      
      

      {/*1번째 걷기 터치 슬라이드 */}
      <div className="main-panel">
        <h2 id="name">걷기 운동</h2>
        {current && (
          <div className="walking-group">
            <span style={{color: speedChange.percentage >= 0 ? 'green' : 'red', fontWeight: 'bold', fontSize: '2em',}}>
            {speedChange.percentage >= 0 ? '▲' : '▼'}
            {speedChange.percentage}%{' '}
            </span>
            <p>걸음걸이 수 변화: {stepChange.difference} ({stepChange.percentage}%)</p>
            <p>속도 변화: {Math.abs(speedChange.difference.toFixed(2))} m/m ({speedChange.percentage}%)</p>
            <p>약 복용 후 시간: {' '}
              {current.timeAfterTakingMedicine ? `${current.timeAfterTakingMedicine}분 경과` : '정보 없음'}
            </p>
            <div className="thermometer">
              {/* 걸음 변화 바 */}
              <div
                className={`thermometer-bar step ${speedChange.difference < 0 ? 'red' : 'green'}`}
                style={{
                  height: `${Math.abs(speedChange.percentage)}%`,
                }}
              ></div>

              {/* 속도 변화 바 */}
              <div
                className={`thermometer-bar speed ${speedChange.difference < 0 ? 'blue' : 'orange'}`}
                style={{
                  height: `${Math.abs(speedChange.percentage)}%`,
                }}
              ></div>
            </div>

            <div className="walking-data">
              <p><strong>이전 데이터:</strong> {previous ? previous.step : '없음'}걸음</p>
              <p><strong>현재 데이터:</strong> {current.step}걸음</p>
              <p><strong>현재 속도:</strong> {current.speed.toFixed(2)} m/m</p>
            </div>
            <div className="navigation-buttons">
              <button onClick={handleFirst} disabled={walkingIndex <= 1}>{"<<"}</button>
              <button onClick={handlePrevious} disabled={walkingIndex <= 1}>{"<"}</button>
              <button onClick={handleNext} disabled={walkingIndex === walkingData.length - 1}>{">"}</button>
              <button onClick={handleLast} disabled={walkingIndex === walkingData.length - 1}>{">>"}</button>
        </div>

          </div>
        )}

        {/* 걷기 데이터 그래프 */}
        <div className="chart-container">
          <h2>걷기 데이터 그래프</h2>
          <Line
            data={{
              labels: walkingData.map((item) => {
              // x축 표시를 "월-일" 형태로 변환
                const date = new Date(item.createdAt);
                return `${date.getMonth() + 1}-${date.getDate()}`;
              }),
              datasets: [
                {
                  label: '걸음수',
                  data: walkingData.map((item) => item.step),
                  borderColor: 'purple',
                  backgroundColor: 'rgba(128, 0, 128, 0.1)',
                  yAxisID: 'y',
                  fill : true,
                  tension: 0.4,
                },
                {
                  label: '속도 (m/m)',
                  data: walkingData.map((item) => item.speed),
                  borderColor: 'red',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  yAxisID: 'y1',
                  fill : true,
                  tension: 0.4,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                datalabels: {
                  display: false, // This will hide all datalabels
                },
                // title: {
                //   display: true,
                //   text: '걸음수 및 속도 데이터 변화',
                // },
                tooltip: {
                  callbacks: {
                    title: function (context) {
                      const index = context[0].dataIndex;
                      const item = walkingData[index];
                      const fullDate = new Date(item.createdAt);
        
                      // 툴팁에 전체 날짜 표시
                      return `${fullDate.getFullYear()}-${fullDate.getMonth() + 1}-${fullDate.getDate()} ${fullDate.getHours()}:${fullDate.getMinutes()}`;
                    },
                    label: function (context) {
                      const index = context.dataIndex;
                      const item = walkingData[index];
                      const medicationTime = item.timeAfterTakingMedicine || '정보 없음';
        
                      // 기본 데이터 툴팁 정보 표시
                      const value = context.raw;
                      const label = context.dataset.label;
        
                      // 약 복용 후 시간 추가
                      return `${label}: ${value} (약 복용 후: ${medicationTime}분 경과)`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: '날짜 (월-일)',
                  },
                  reverse: true,
                },
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: '걸음수',
                  },
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: '속도 (m/m)',
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            }}
          />
        </div>
        <div className="chart-container">
          <h2>약 복용 후 시간에 따른 속도 변화</h2>
          <Line
            data={{
              labels: walkingData
                .filter((item) => item.timeAfterTakingMedicine !== undefined && item.timeAfterTakingMedicine !== null)
                .sort((a, b) => a.timeAfterTakingMedicine - b.timeAfterTakingMedicine) // 시간에 따라 오름차순 정렬
                .map((item) => item.timeAfterTakingMedicine), // x축: 약 복용 후 경과 시간 (분)
              datasets: [
                {
                  label: '속도 (m/m)',
                  data: walkingData
                    .filter((item) => item.timeAfterTakingMedicine !== undefined && item.timeAfterTakingMedicine !== null)
                    .sort((a, b) => a.timeAfterTakingMedicine - b.timeAfterTakingMedicine) // 동일한 정렬
                    .map((item) => item.speed), // y축: 속도
                      borderColor: 'purple',
                      backgroundColor: 'rgba(128, 0, 128, 0.1)',
                      fill: true,
                      tension: 0.4,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                  legend: {
                    position: 'top',
                  },
                  datalabels: {
                    display: false, // This will hide all datalabels
                  },
                tooltip: {
                  callbacks: {
                    title: function (context) {
                      const index = context[0].dataIndex;
                      const sortedData = walkingData
                        .filter((item) => item.timeAfterTakingMedicine !== undefined && item.timeAfterTakingMedicine !== null)
                        .sort((a, b) => a.timeAfterTakingMedicine - b.timeAfterTakingMedicine);
                      const item = sortedData[index];
                      return `약 복용 후 ${item.timeAfterTakingMedicine}분 경과`;
                    },
                    label: function (context) {
                      return `속도: ${context.raw.toFixed(2)} m/m`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: '약 복용 후 경과 시간 (분)',
                  },
                  ticks: {
                    stepSize: 10, // x축 간격 설정 (필요에 따라 변경)
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: '속도 (m/m)',
                  },
                },
              },
            }}
          />
        </div>
        
      </div>
      {/* 2번째 손 터치 슬라이드 */}
      <div className='dashboard2'>
      <h2 id="name">손가락 운동</h2>
      
      {currentFinger && (
        <div className="walking-group">
            <div className="finger-exercise-group">
              <div className="finger-thermometer">
                <span 
                  style={{
                    color: change.percentage >= 0 ? 'green' : 'red', 
                    fontWeight: 'bold', 
                    fontSize: '2em'
                  }}
                >
                  {change.percentage === 0 ? '=' : (change.percentage > 0 ? '▲' : '▼')}
                  {Math.abs(change.percentage)}%
                </span>                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                <h3 id="hands">{selectedHand === 'L' ? '왼손' : '오른손'}</h3>
                <button 
                  onClick={toggleSelectedHand}
                  className="hand-toggle-button"
                >
                  {selectedHand === 'L' ? '오른손으로 전환' : '왼손으로 전환'}
                </button>
              </div>
                <div className="thermometer">
                  <div
                    className={`thermometer-bar ${change.difference >= 0 ? 'green' : 'red'}`}
                    style={{
                      height: `${Math.abs(change.percentage)}%`,
                    }}
                  ></div>
                </div>


              </div>
            </div>
              <div className="finger-data">
                <p>
                  <strong>평균 터치 횟수:</strong> {averageTouchCount.toFixed(1)}회
                </p>
                <p>
                  <strong>현재 데이터:</strong> {currentFinger.count.toFixed(1)}회
                </p>
                <p>
                  <strong>평균과의 차이:</strong> {change.difference.toFixed(1)}회 ({change.percentage}%)
                </p>
                <p>
                  <strong>약 복용 후 시간:</strong> {
                    currentFinger.timeAfterTakingMedicine 
                      ? `${currentFinger.timeAfterTakingMedicine}분 경과` 
                      : '정보 없음'
                  }
                </p>
              </div>

              <div className="navigation-buttons">
                <button 
                  onClick={handleFingerFirst} 
                  disabled={fingerIndex <= 0}
                  className="nav-button"
                >
                  {"<<"}
                </button>
                <button 
                  onClick={handleFingerPrevious} 
                  disabled={fingerIndex <= 0}
                  className="nav-button"
                >
                  {"<"}
                </button>
                <button 
                  onClick={handleFingerNext} 
                  disabled={fingerIndex >= fingerData.filter(d => d.hand === selectedHand).length - 1}
                  className="nav-button"
                >
                  {">"}
                </button>
                <button 
                  onClick={handleFingerLast} 
                  disabled={fingerIndex >= fingerData.filter(d => d.hand === selectedHand).length - 1}
                  className="nav-button"
                >
                  {">>"}
                </button>
              </div>
            </div>
          )}
        <div className="chart-container">
          <h2>양손별 터치변화 추이</h2>
            <Line
              data={{
                labels: fingerData.filter((item) => item.hand === 'L').map((item) => {
                  const date = new Date(item.createdAt);
                  return `${date.getMonth() + 1}-${date.getDate()}`; // x축 표시를 "월-일"로 변환
                }),
                datasets: [
                  {
                    label: '왼손',
                    data: fingerData
                      .filter((item) => item.hand === 'L')
                      .map((item) => item.count),
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    fill : true,
                    tension: 0.4,
                  }
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  datalabels: {
                    display: false, // This will hide all datalabels
                  },
                  // title: {
                  //   display: true,
                  //   text: '왼손 터치 데이터',
                  // },
                  tooltip: {
                    callbacks: {
                      title: function (context) {
                        const index = context[0].dataIndex;
                        const item = fingerData.filter((item) => item.hand === 'L')[index];
                        const fullDate = new Date(item.createdAt);
                        return `${fullDate.getFullYear()}-${fullDate.getMonth() + 1}-${fullDate.getDate()} ${fullDate.getHours()}:${fullDate.getMinutes()}`;
                      },
                      label: function (context) {
                        const index = context.dataIndex;
                        const item = fingerData.filter((item) => item.hand === 'L')[index];
                        const medicationTime = item.timeAfterTakingMedicine || '정보 없음';
        
                        // 기본 데이터와 약 복용 후 시간 표시
                        return `횟수: ${item.count} (약 복용 후: ${medicationTime}분 경과)`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: '날짜 (월-일)',
                    },
                    reverse: true,
                  },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: '터치 횟수',
                    },
                    min: 0,
                    max: 600,
                  },
                },
              }}
            />
            
            <Line
              data={{
                labels: fingerData.filter((item) => item.hand === 'R').map((item) => {
                  const date = new Date(item.createdAt);
                  return `${date.getMonth() + 1}-${date.getDate()}`; // x축 표시를 "월-일"로 변환
                }),
                datasets: [
                  {
                    label: '오른손',
                    data: fingerData
                      .filter((item) => item.hand === 'R')
                      .map((item) => item.count),
                    borderColor: 'purple',
                    backgroundColor: 'rgba(128, 0, 128, 0.1)',
                    fill : 'origin',
                    tension: 0.4,
                  }
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  datalabels: {
                    display: false, // This will hide all datalabels
                  },
                  // title: {
                  //   display: true,
                  //   text: '오른손 터치 데이터',
                  // },
                  tooltip: {
                    callbacks: {
                      title: function (context) {
                        const index = context[0].dataIndex;
                        const item = fingerData.filter((item) => item.hand === 'R')[index];
                        const fullDate = new Date(item.createdAt);
                        return `${fullDate.getFullYear()}-${fullDate.getMonth() + 1}-${fullDate.getDate()} ${fullDate.getHours()}:${fullDate.getMinutes()}`;
                      },
                      label: function (context) {
                        const index = context.dataIndex;
                        const item = fingerData.filter((item) => item.hand === 'R')[index];
                        const medicationTime = item.timeAfterTakingMedicine || '정보 없음';
        
                        // 기본 데이터와 약 복용 후 시간 표시
                        return `횟수: ${item.count} (약 복용 후: ${medicationTime}분 경과)`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: '날짜 (월-일)',
                    },
                    reverse: true,
                  },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: '터치 횟수',
                    },
                    min: 0,
                    max: 600,
                  },
                },
              }}
            />
        </div>
        <div className="chart-container">
        <div className='chart2-finger'>
        <h2>약 복용 후 시간에 따른 터치 변화</h2>
          <Scatter 
            data={{
              datasets: [
                {
                  label: '왼손',
                  data: fingerData
                    .filter((item) => item.hand === 'L')
                    .map((item) => ({
                      x: item.timeAfterTakingMedicine, // X축: 약 복용 후 경과 시간
                      y: item.count, // Y축: 터치 횟수
                    })),
                  backgroundColor: 'rgba(255, 0, 0, 0.5)',
                },
                {
                  label: '오른손',
                  data: fingerData
                    .filter((item) => item.hand === 'R')
                    .map((item) => ({
                      x: item.timeAfterTakingMedicine, // X축: 약 복용 후 경과 시간
                      y: item.count, // Y축: 터치 횟수
                    })),
                  backgroundColor: 'rgba(128, 0, 128, 0.5)',
                },
                {
                  data: [
                    { x: Math.min(...fingerData.map(item => item.timeAfterTakingMedicine)), y: leftHandAverage },
                    { x: Math.max(...fingerData.map(item => item.timeAfterTakingMedicine)), y: leftHandAverage },
                  ],
                  borderColor: 'red',
                  borderWidth: 2,
                  showLine: true, // 선만 표시
                  pointRadius: 0, // 점 숨기기
                },
                {
                  data: [
                    { x: Math.min(...fingerData.map(item => item.timeAfterTakingMedicine)), y: rightHandAverage },
                    { x: Math.max(...fingerData.map(item => item.timeAfterTakingMedicine)), y: rightHandAverage },
                  ],
                  borderColor: 'purple',
                  borderWidth: 2,
                  showLine: true,
                  pointRadius: 0,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    filter: (legendItem, data) => legendItem.text !== undefined
                  }
                },
                datalabels: {
                  display: false, // This will hide all datalabels
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: '약 복용 후 경과 시간 (분)',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: '터치 횟수',
                  },
                },
              },
              
            }}
          />
        </div>
        </div>
      </div>
      {/* 3번째 눈깜빡임 슬라이드 */}
      {/* 눈 깜빡임 데이터 그래프 */}
      <div className="dashboard3">
        <h2 id='name'>눈 깜빡임</h2>
        <div className="walking-group">
        {getCurrentBlinkData() && (
            <div className="blink-exercise-group">
              <div className="blink-thermometer">
              <span 
                  style={{
                    color: blinkChange.percentage >= 0 ? 'green' : 'red', 
                    fontWeight: 'bold', 
                    fontSize: '2rem'
                  }}
                >
                  {blinkChange.percentage === 0 ? '=' : (blinkChange.percentage > 0 ? '▲' : '▼')}
                  {Math.abs(blinkChange.percentage)}%
                </span>
                <div className="thermometer">                

                  <div
                    className={`thermometer-bar ${blinkChange.difference >= 0 ? 'green' : 'red'}`}
                    style={{
                      height: `${Math.abs(blinkChange.percentage)}%`,
                    }}
                  ></div>
                </div>

              </div>

              <div className="blink-data">
                <p>
                  <strong>평균 깜빡임 횟수:</strong> {averageBlinkCount.toFixed(1)}회
                </p>
                <p>
                  <strong>현재 데이터:</strong> {getCurrentBlinkData().count.toFixed(1)}회
                </p>
                <p>
                  <strong>평균과의 차이:</strong> {blinkChange.difference.toFixed(1)}회 ({blinkChange.percentage}%)
                </p>
                <p>
                  <strong>약 복용 후 시간:</strong> {
                    getCurrentBlinkData().timeAfterTakingMedicine 
                      ? `${getCurrentBlinkData().timeAfterTakingMedicine}분 경과` 
                      : '정보 없음'
                  }
                </p>
              </div>

              <div className="navigation-buttons">
                <button 
                  onClick={handleBlinkFirst} 
                  disabled={blinkIndex <= 0}
                  className="nav-button"
                >
                  {"<<"}
                </button>
                <button 
                  onClick={handleBlinkPrevious} 
                  disabled={blinkIndex <= 0}
                  className="nav-button"
                >
                  {"<"}
                </button>
                <button 
                  onClick={handleBlinkNext} 
                  disabled={blinkIndex >= blinkData.length - 1}
                  className="nav-button"
                >
                  {">"}
                </button>
                <button 
                  onClick={handleBlinkLast} 
                  disabled={blinkIndex >= blinkData.length - 1}
                  className="nav-button"
                >
                  {">>"}
                </button>
              </div>
            </div>
          )}
          </div>
        <div className="chart-container">
        <h2>눈 깜빡임 데이터</h2>
        <Line
          data={{
            labels: blinkData.map((item) => {
              const date = new Date(item.createdAt);
              return `${date.getMonth() + 1}-${date.getDate()}`; // x축 표시를 "월-일"로 변환
            }),
            datasets: [
              {
                label: '눈 깜빡임 횟수',
                data: blinkData.map((item) => item.count),
                borderColor: 'purple',
                backgroundColor: 'rgba(128, 0, 128, 0.1)',
                fill : true,
                tension: 0.4,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              datalabels: {
                display: false, // This will hide all datalabels
              },
              // title: {
              //   display: true,
              //   text: '눈 깜빡임 데이터',
              // },
              tooltip: {
                callbacks: {
                  title: function (context) {
                    const index = context[0].dataIndex;
                    const item = blinkData[index];
                    const fullDate = new Date(item.createdAt);
                    return `${fullDate.getFullYear()}-${fullDate.getMonth() + 1}-${fullDate.getDate()} ${fullDate.getHours()}:${fullDate.getMinutes()}`;
                  },
                  label: function (context) {
                    const index = context.dataIndex;
                    const item = blinkData[index];
                    const medicationTime = item.timeAfterTakingMedicine || '정보 없음';

                    // 기본 데이터와 약 복용 후 시간 표시
                    return `횟수: ${item.count} (약 복용 후: ${medicationTime}분 경과)`;
                  },
                },
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: '날짜 (월-일)',
                },
                reverse: true,
              },
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                // title: {
                //   display: true,
                //   text: '눈 깜빡임 횟수',
                // },
              },
            },
          }}
        />
        </div>
        <BlinkHeatmap />


      </div>
      

    </div>
  );
}

export default Dashboard;
