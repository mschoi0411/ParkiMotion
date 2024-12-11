import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import './Page2.css';
import image2 from '../image/image2.jpg'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

function Page2({ token }) {
  const [patientId, setPatientId] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [allPatientsData, setAllPatientsData] = useState(null);
  const [genderData, setGenderData] = useState(null);
  const [ageData, setAgeData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllPatientsData();
  }, []);

  const fetchAllPatientsData = async () => {
    if (!token) {
      alert('인증이 필요합니다. 다시 로그인해주세요.');
      navigate('/');
      return;
    }

    try {
      const allPatients = [];
      let page = 0;
      const size = 100; // 한 번에 가져올 데이터 수
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await fetch(`https://kwhcclab.com:20757/api/users?page=${page}&size=${size}`, {
          headers: { 'X-Auth-Token': token },
        });

        if (response.ok) {
          const data = await response.json();
          allPatients.push(...data.data);
          
          if (data.data.length < size) {
            hasMoreData = false;
          } else {
            page++;
          }
        } else if (response.status === 401) {
          alert('인증에 실패했습니다. 다시 로그인해주세요.');
          navigate('/');
          return;
        } else {
          alert('환자 데이터를 불러오는데 실패했습니다.');
          return;
        }
      }

      setAllPatientsData(allPatients);
      processGenderData(allPatients);
      processAgeData(allPatients);
    } catch (error) {
      console.error('Error fetching all patients data:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const processGenderData = (data) => {
    const genderCounts = data.reduce((acc, patient) => {
      acc[patient.gender] = (acc[patient.gender] || 0) + 1;
      return acc;
    }, {});

    setGenderData({
      labels: ['남성', '여성'],
      datasets: [
        {
          label: '성별 분포',
          data: [genderCounts['M'] || 0, genderCounts['F'] || 0],
          backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1,
        },
      ],
    });
  };

  const processAgeData = (data) => {
    const currentYear = new Date().getFullYear();
    const ageGroups = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81+': 0
    };

    data.forEach(patient => {
      const birthYear = parseInt(patient.birthdate.split('-')[0]);
      const age = currentYear - birthYear;

      if (age <= 20) ageGroups['0-20']++;
      else if (age <= 40) ageGroups['21-40']++;
      else if (age <= 60) ageGroups['41-60']++;
      else if (age <= 80) ageGroups['61-80']++;
      else ageGroups['81+']++;
    });

    setAgeData({
      labels: Object.keys(ageGroups),
      datasets: [
        {
          label: '환자 수',
          data: Object.values(ageGroups),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    });
  };

  const handleSearch = async () => {
    if (!token) {
      alert('인증이 필요합니다. 다시 로그인해주세요.');
      navigate('/');
      return;
    }

    if (!patientId.trim()) {
      alert('환자 ID를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`https://kwhcclab.com:20757/api/users/${patientId}`, {
        headers: { 'X-Auth-Token': token },
      });

      if (response.ok) {
        const data = await response.json();
        setPatientData(data);
      } else if (response.status === 401) {
        alert('인증에 실패했습니다. 다시 로그인해주세요.');
        navigate('/');
      } else {
        alert('환자 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleDashboardClick = () => {
    if (patientData) {
      navigate('/dashboard', { state: { patientId, patientData } });
    } else {
      alert('먼저 환자 정보를 검색해주세요.');
    }
  };

  return (
    <div className="page2-container">
      <div className="search-card">
        <div className="search-content">
          <h1 className="search-name">환자 검색</h1>
          <div className="search-container">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="환자 ID를 입력해주세요"
                className="search-input"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
              <button className="search-button" onClick={handleSearch}>
                <span role="img" aria-label="search">🔍</span>
              </button>
            </div>
          </div>

          {patientData && (
            <div className="patient-info">
              <h2>환자 정보</h2>
              <p><strong>ID:</strong> {patientData.id}</p>
              <p><strong>이름:</strong> {patientData.name}</p>
              <p><strong>성별:</strong> {patientData.gender === 'M' ? '남성' : '여성'}</p>
              <p><strong>생년월일:</strong> {patientData.birthdate}</p>
              <p><strong>진단 연도:</strong> {patientData.diagnosis}</p>
            </div>
          )}

          {patientData && (
            <button className="go-dashbord" onClick={handleDashboardClick}>대시보드 보기</button>
          )}
        </div>
        <div className="search-image1">
          {genderData && (
            <div className="chart-container">
              <h2>전체 환자 성별 분포</h2>
              <Bar 
                data={genderData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: '성별 분포',
                    },
                    datalabels: {
                      anchor: 'end',
                      align: 'top',
                      formatter: (value) => value,
                    },
                  },
                }}
              />
            </div>
            
          )}
          </div>
          <div className="search-image2">
          {ageData && (
            <div className="chart-container">
              <h2>전체 환자 나이 분포</h2>
              <Bar
                data={ageData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: '나이 분포',
                    },
                    datalabels: {
                      anchor: 'end',
                      align: 'top',
                      formatter: (value) => value,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: '환자 수',
                      },
                    },
                  },
                }}
              />
            </div>
            
          )}
          {!genderData && !ageData && (
            <img src={image2} alt="Team Illustration" />
          )}
        </div>
      </div>
    </div>
  );
}

export default Page2;