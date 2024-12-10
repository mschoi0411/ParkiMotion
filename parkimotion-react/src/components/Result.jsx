import React from 'react';
import './Result.css';

function Result({ data }) {
  return (
    <div className="result-container">
      <h1 className="result-title">종합 결과</h1>
      <div>
        <h2 className="result-section-title">눈 검사</h2>
        {data.eyes ? (
          <ul>
            {data.eyes.map((item) => (
              <li key={item.id} className="result-item">
                검사 ID: {item.id}, 깜빡임 횟수: {item.count}, 시간: {item.createdAt}
              </li>
            ))}
          </ul>
        ) : (
          <p className="result-empty">눈 검사 데이터가 없습니다.</p>
        )}
      </div>

      <div>
        <h2 className="result-section-title">손 검사</h2>
        {data.hands ? (
          <ul>
            {data.hands.map((item) => (
              <li key={item.id} className="result-item">
                검사 ID: {item.id}, 터치 횟수: {item.count}, 손: {item.hand}, 시간: {item.createdAt}
              </li>
            ))}
          </ul>
        ) : (
          <p className="result-empty">손 검사 데이터가 없습니다.</p>
        )}
      </div>

      <div>
        <h2 className="result-section-title">걷기 검사</h2>
        {data.walking ? (
          <ul>
            {data.walking.map((item) => (
              <li key={item.id} className="result-item">
                검사 ID: {item.id}, 거리: {item.distance}m, 시간: {item.time}분, 발걸음 수: {item.step}
              </li>
            ))}
          </ul>
        ) : (
          <p className="result-empty">걷기 검사 데이터가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default Result;
