import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Page1.css';
import image1 from '../image/image1.jpg'

function Page1({ setToken }) {
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      const response = await fetch('https://kwhcclab.com:20757/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'admin',
          birthdate: '1111-11-11',
          password: 'snuhkwu2023',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token); // 토큰 저장
        alert('로그인 성공: ' + data.token);
        navigate('/page2'); // Page2로 이동
      } else {
        alert('로그인 실패: 서버 응답 오류');
      }
    } catch (error) {
      console.error('Login Error:', error);
      alert('서버 연결 오류: 다시 시도해주세요.');
    }
  };

  return (
    <div className="page1-container">
  <div className="info-card">
    <div className="info-content">
    <p className="subtitle"><strong>Information Design and Programm Team1</strong></p>
      <h1 id="teamname">ParkiMotion</h1>
      <p className="course">
        <strong>무하마드 이르판 나즈미</strong><br />
        <strong>손호성 정유경 최민석 허연욱</strong>
      </p>
      <button onClick={handleConnect} className="connect-button">Connect</button>
      <p className="explain"><strong>서버에 접속하여 파킨슨 병 환자의 운동 기록을 확인하세요</strong>
      </p>
    </div>
    <div className="info-image">
      <img src= {image1} alt="Team Illustration" />
    </div>
  </div>
</div>
  );
}

export default Page1;
