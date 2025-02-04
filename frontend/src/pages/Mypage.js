import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../css/main.css';
import MenuIcon from '@mui/icons-material/Menu';
import LocationOnIcon from '@mui/icons-material/LocationOn';

function Mypage({setIsAuthenticated}) {

  const [userData, setUserData] = useState(null);
  const [accessHistory, setAccessHistory] = useState([]);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    userData: "",
    accessHistory: "",
  });

  const navigate = useNavigate(); // navigate 추가

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 사용자 데이터 가져오기
        const responseUser = await fetch(`${process.env.REACT_APP_API_URL}/api/mypage/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          credentials: "include",
        });

        if (responseUser.ok) {
          const data = await responseUser.json();
          if (validateUserData(data.data)) {
            setUserData(data.data);
            setValidationErrors((prev) => ({ ...prev, userData: "" }));
          } else {
            setValidationErrors((prev) => ({
              ...prev,
              userData: "유효하지 않은 사용자 데이터입니다.",
            }));
          }
        } else {
          setError("사용자 데이터를 불러오는 데 실패했어요");
        }

        // 접속 이력 가져오기
        const responseHistory = await fetch(`${process.env.REACT_APP_API_URL}/api/history/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          credentials: "include",
        });

        if (responseHistory.ok) {
          const dataHistory = await responseHistory.json();
          if (validateAccessHistory(dataHistory.data)) {
            setAccessHistory(dataHistory.data);
            setValidationErrors((prev) => ({ ...prev, accessHistory: "" }));
          } else {
            setValidationErrors((prev) => ({
              ...prev,
              accessHistory: "유효하지 않은 접속 이력 데이터입니다.",
            }));
          }
        } else {
          setError("접속 이력을 불러오는 데 실패했어요.");
        }
      } catch (err) {
        //console.error("데이터를 받아오는데 실패했습니다:", err);
        setError("데이터를 요청을 실패했어요.");
      }
    };

    fetchData();
  }, []);

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  const validateUserData = (data) => {
    if (!data) return false;
    if (!data.user_id || typeof data.user_id !== "string") return false;
    if (data.nickname && typeof data.nickname !== "string") return false;
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) return false;
    if (data.region && typeof data.region !== "string") return false;
    if (data.diseases && typeof data.diseases !== "string") return false;
    return true;
  };

  const validateAccessHistory = (data) => {
    if (!Array.isArray(data)) return false;
    return data.every((history) => {
      return (
        typeof history.access_time === "string" &&
        !isNaN(new Date(history.access_time).getTime()) &&
        typeof history.access_ip === "string" &&
        typeof history.result === "number"
      );
    });
  };

  const getResultMessage = (resultCode) => {
    switch (resultCode) {
      case 0:
        return "회원가입";
      case 1:
        return "로그인 성공";
      case 2:
        return "로그인 실패";
      case 3:
        return "회원정보 수정";
      case 4:
        return "비밀번호 수정";
      default:
        return "알 수 없는 결과";
    }
  };

  const getTrId = (resultCode) => {
    if (resultCode === 2) {
      return "failure-row";
    } else {
      return "success-row";
    }
  };  

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <p className="menu-button" onClick={toggleSidebar}><MenuIcon sx={{ fontSize: 25 }} className="header-button" /></p>
        <div className="location">{userData ? `${userData.nickname}'s mypage` : 'mypage'}</div>
        <Link to={'/map'}><LocationOnIcon sx={{ fontSize: 25 }} className="header-button" /></Link>
      </header>

      {sidebarOpen && (
        <aside className="sidebar">
          <p className="menu-button" onClick={toggleSidebar}><MenuIcon sx={{ fontSize: 25 }} className="header-button" /></p>
          <ul>
            <li><Link to="/main">홈</Link></li>
            <li><Link to="/mypage">마이페이지</Link></li>
            <li>
              <Link 
                onClick={async (e) => {
                  e.preventDefault();
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
                로그아웃
              </Link>
            </li>

          </ul>
        </aside>
      )}
    {/* <div className="mypage-container"> */}
      <h1>마이페이지</h1>
      {error && <p className="error-message">{error}</p>}
      {validationErrors.userData && <p className="error-message">{validationErrors.userData}</p>}
      {userData ? (
        <div className="user-info">
          <p><strong>아이디:</strong> {userData.user_id}</p>
          <p><strong>닉네임:</strong> {userData.nickname}</p>
          <p><strong>이메일:</strong> {userData.email}</p>
          <p><strong>관측소 지역:</strong> {userData.region}</p>
          <p><strong>질환:</strong></p>
          <div className="diseases-cards">
            {userData.diseases !== null && userData.diseases !== '' ? userData.diseases.split(",").map((disease, index) => (
              <div key={index} className="disease-card">
                {disease}
              </div>
            ))
            :
            <div className="disease-card">
                  {"없음"}
                </div>}
          </div>
          <p>&nbsp;</p>
          <Link to="/update"><button>정보수정</button></Link>
          <hr />
          <Link to="/updatePassword"><button>비밀번호수정</button></Link>
          <hr />
          <p>&nbsp;</p>
          {/*
          <h1>보안이력</h1>
          {validationErrors.accessHistory && <p className="error-message">{validationErrors.accessHistory}</p>}
          {accessHistory.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>발생 시간</th>
                  <th>요청 IP</th>
                  <th>결과</th>
                </tr>
              </thead>
              <tbody>
                {accessHistory.slice().reverse().map((history, index) => (
                  <tr key={index} className={getTrId(history.result)}>
                    <td>{new Date(history.access_time).toLocaleString()}</td>
                    <td>{history.access_ip}</td>
                    <td>{getResultMessage(history.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>접속 이력이 없습니다.</p>
          )}
          */}
        </div>
      ) : (
        !error && <p>Loading user data...</p>
      )}
    </div>
  );
}

export default Mypage;