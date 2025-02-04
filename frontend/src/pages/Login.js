import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Link만 임포트
import '../css/login.css';

async function hashPasswordPBKDF2(password, salt) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = encoder.encode(salt);

  const key = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const pbkdf2Key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"]
  );

  const hashBuffer = await crypto.subtle.sign("HMAC", pbkdf2Key, passwordBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function Login({ setIsAuthenticated }) {  // setIsAuthenticated를 props로 받음
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const saltResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/s/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!saltResponse.ok) {
        throw new Error("올바른 정보가 아니에요...");
      }

      const { salt } = await saltResponse.json();
      const encryptedPw = await hashPasswordPBKDF2(pw, salt);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw: encryptedPw }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Login Successful:", data);
        // HTTP 일 경우
        document.cookie = `sessionid=${data.data.session_id}; path=/;`;
        document.cookie = `csrftoken=${data.data.csrftoken}; path=/;`;
        localStorage.removeItem("salt");
        localStorage.setItem("salt", data.data.salt);
        localStorage.setItem("user_id", data.data.user_id);
        localStorage.setItem("email", data.data.email);
        localStorage.setItem("region", data.data.region);
        localStorage.setItem("diseases", data.data.diseases);
        localStorage.setItem("nickname", data.data.nickname);
        // HTTPS 일 경우
        // document.cookie = `sessionid=${data.data.session_id}; path=/; Secure; SameSite=Strict`;
        // document.cookie = `csrftoken=${data.data.csrftoken}; path=/; Secure; SameSite=Strict`;

        // React 상태 업데이트
        setIsAuthenticated(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "올바른 정보가 아니에요...");
      }
    } catch (err) {
      console.error("Request failed:", err);
      setError(err.message || "로그인 요청을 실패했어요...");
    } finally {
      setTimeout(() => {setLoading(false)}, 1000);
    }
  };

  return (
    <div className="app-container">
      <h2 className='login-title'>로그인</h2>
      <div className='form-container'>
      <form onSubmit={handleSubmit}>
        <div class="input-container">
        {/* <label htmlFor="id">아이디:</label> */}
          <input 
            placeholder="아이디" 
            class="input-field" 
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required/>
          <label for="input-field" class="input-label">아이디</label>
          <span class="input-highlight"></span>
        </div>

        <div class="input-container">
        {/* <label htmlFor="pw">비밀번호:</label> */}
          <input 
            placeholder="비밀번호" 
            class="input-field" 
            type="password"
            id="pw"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required/>
          <label for="input-field" class="input-label">비밀번호</label>
          <span class="input-highlight"></span>
        </div>
        {error && <p className="error-message">{error}</p>}

        <button className="button" type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
          <span class="button-span"></span>
        </button>

        <div className="register-section">
          <p className='reg-text'>아직 회원이 아니신가요?</p>
          <Link to="/register">
            <button className="button">
              회원가입
              <span class="button-span"></span>
            </button>
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}

export default Login;