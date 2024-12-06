import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { Line } from 'react-chartjs-2';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard({ token }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientId } = location.state || {};

  const [patientData, setPatientData] = useState(null);

  const [walkingData, setWalkingData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1); // 기본값을 1로 설정 (2번째 데이터부터 표시)
  
  const [fingerData, setFingerData] = useState([]);

  const [blinkData, setBlinkData] = useState([]); // 눈 깜빡임 데이터 상태 변수

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
      alert('환자 ID가 필요합니다.');
      navigate('/page2');
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
        const walkingResponse = await fetch(`https://kwhcclab.com:20757/api/tests/gait?userId=${patientId}`, {
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
        const fingerResponse = await fetch(`https://kwhcclab.com:20757/api/tests/finger?userId=${patientId}`, {
          headers: { 'X-Auth-Token': token },
        });
        const fingerData = await fingerResponse.json();
        setFingerData(fingerData.data || []);

        // 눈 깜빡임 데이터 가져오기
        const blinkResponse = await fetch(`https://kwhcclab.com:20757/api/tests/quick-blink?userId=${patientId}`, {
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
  }, [patientId, token, navigate]);


  const calculateChange = (current, previous, field) => {
    const difference = current[field] - previous[field];
    let percentage = previous[field] !== 0
    ? ((difference / previous[field]) * 100).toFixed(2)
    : 0; // 이전 값이 0이면 0% 반환
    percentage = Math.min(percentage, 100);
    return { difference, percentage };
  };

  const handleFirst = () => setCurrentIndex(1);
  const handleLast = () => setCurrentIndex(walkingData.length - 1);
  const handleNext = () => {
    if (currentIndex < walkingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  const handlePrevious = () => {
    if (currentIndex > 1) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const current = walkingData[currentIndex];
  const previous = currentIndex > 0 ? walkingData[currentIndex - 1] : null;

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

  return (
    <div className="dashboard-container">
      {/* 사이드 바 */}
      <div className="sidebar">
        <h2 id="name">환자 정보</h2>
        {patientData ? (
          <div id="info">
            <p><strong>ID:</strong> {patientData.id}</p>
            <p><strong>이름:</strong> {patientData.name}</p>
            <p><strong>성별:</strong> {patientData.gender === 'M' ? '남성' : '여성'}</p>
            <p><strong>생년월일:</strong> {patientData.birthdate}</p>
            <p><strong>진단 연도:</strong> {patientData.diagnosis}</p>
          </div>
        ) : (
          <p>환자 정보를 불러오는 중...</p>
        )}

        {/* 발성 운동 데이터 다운로드 */}
        <div className="vocal-exercises">
          <h2>발성 운동 데이터 다운</h2>
          <div id="down">
          {vocalExercises.map((exercise) => (
            <button id= 'btn-down' key={exercise.endpoint} onClick={() => handleDownload(exercise.endpoint, exercise.name)}>
              {exercise.name}
            </button>
          ))}
          </div>
        </div>

      </div>
      
      

      {/*1번째 손 터치 슬라이드 */}
      <div className="main-panel">
        <h2 id="name">걷기 운동</h2>
        {current && (
          <div className="walking-group">
            <h2>데이터 ID: {current.id}</h2>
            <p><strong>걸음걸이 수 변화:</strong> {stepChange.difference} ({stepChange.percentage}%)</p>
            <p><strong>속도 변화:</strong> {speedChange.difference.toFixed(2)} m/m ({speedChange.percentage}%)</p>

            <div className="thermometer">
              {/* 걸음 변화 바 */}
              <div
                className={`thermometer-bar step ${stepChange.difference < 0 ? 'green' : 'red'}`}
                style={{
                  height: `${Math.abs(stepChange.percentage)}%`,
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
              <button onClick={handleFirst} disabled={currentIndex <= 1}>{"<<"}</button>
              <button onClick={handlePrevious} disabled={currentIndex <= 1}>{"<"}</button>
              <button onClick={handleNext} disabled={currentIndex === walkingData.length - 1}>{">"}</button>
              <button onClick={handleLast} disabled={currentIndex === walkingData.length - 1}>{">>"}</button>
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
                  borderColor: 'rgba(0, 0, 255, 0.5)',
                  backgroundColor: 'rgba(0, 0, 255, 0.1)',
                  yAxisID: 'y',
                },
                {
                  label: '속도 (m/m)',
                  data: walkingData.map((item) => item.speed),
                  borderColor: 'red',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  yAxisID: 'y1',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
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
      </div>
      {/* 2번째 손 터치 슬라이드 */}
      <div className='dashboard2'>
      <h2 id="name">손가락 운동</h2>
        <div className="finger-chart">
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
                  }
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
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
                  },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: '터치 횟수',
                    },
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
                    borderColor: 'green',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                  }
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
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
                  },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
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
      {/* 3번째 눈깜빡임 슬라이드 */}
      {/* 눈 깜빡임 데이터 그래프 */}
      <div className="dashboard3">
        <h2 id="name">눈 깜빡임</h2>
        <div className='blink-chart'>
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
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
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
      </div>


    </div>
  );
}

export default Dashboard;
