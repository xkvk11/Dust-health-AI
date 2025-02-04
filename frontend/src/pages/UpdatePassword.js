import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

function UpdatePassword({setIsAuthenticated}) {
    const currentSalt = localStorage.getItem("salt");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    try {
        const userId = ""; // 저장된 유저 아이디
        const response = async () => await fetch(`${process.env.REACT_APP_API_URL}/api/s`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({
                id: userId,
            }),
        })
        const data = response.json();
        
    } catch (error) {

    }

    const handleUpdatePassword = async (event) => {
        event.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            setErrorMessage("모든 필드를 입력해주세요.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("새 비밀번호와 확인 비밀번호가 일치하지 않아요.");
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage("비밀번호는 최소 8자 이상이어야 해요.");
            return;
        }

        try {
            setLoading(true);
            const newSalt = generateRandomString(60); // Salt 생성
            const hashedNewPassword = await hashPasswordPBKDF2(newPassword, newSalt); // 새 비밀번호 해싱
            const hashedCurrentPassword = await hashPasswordPBKDF2(currentPassword, currentSalt); // 새 비밀번호 해싱
            // console.log(`[기존 salt: ${currentSalt}\n기존비번: ${hashedCurrentPassword}]`);
            // console.log(`새 salt: ${newSalt}\n새비번: ${hashedNewPassword}`);

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/updatePassword/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                credentials: "include",
                body: JSON.stringify({
                    current_password: hashedCurrentPassword,
                    new_password: hashedNewPassword,
                    new_salt: newSalt,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSuccessMessage("비밀번호가 성공적으로 변경되었어요. 다시 로그인 해 주세요.");
                setErrorMessage("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                // HTTP 일 경우
                document.cookie = `csrftoken=${data.data.csrftoken}; path=/;`;
                localStorage.removeItem("salt");
                // HTTPS 일 경우
                // document.cookie = `csrftoken=${data.data.csrftoken}; path=/; Secure; SameSite=Strict`;
                setTimeout(() => {
                    setIsAuthenticated(false);
                    navigate('/login', {replace: true}); // 성공 후 로그인 페이지로 리디렉션
                }, 2000);
            } else {
                setErrorMessage(data.message || "비밀번호 변경에 실패했어요.");
                setSuccessMessage("");
            }
        } catch (error) {
            console.error("Error updating password:", error);
            setErrorMessage("서버 요청 중 오류가 발생했어요.");
            setSuccessMessage("");
        } finally {
            setTimeout(() => {setLoading(false)}, 3000);
        }
    };

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
    }

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

    function generateRandomString(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return Array.from(array, (byte) => characters[byte % characters.length]).join("");
    }

    return (
        <div className="update-password-container">
            <h1>비밀번호 변경</h1>
            <form onSubmit={handleUpdatePassword}>
                <div>
                    <label htmlFor="current-password">현재 비밀번호</label>
                    <input
                        type="password"
                        id="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        readOnly={loading}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="new-password">새 비밀번호</label>
                    <input
                        type="password"
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        readOnly={loading}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password">새 비밀번호 확인</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        readOnly={loading}
                        required
                    />
                </div>
                <p>&nbsp;</p>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <button type="submit" disabled={loading}>{loading ? "비밀번호 변경중..." : "비밀번호 변경"}</button>
            </form>
        </div>
    );
}

export default UpdatePassword;