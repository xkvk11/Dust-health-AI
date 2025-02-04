import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Update() {
  const [formData, setFormData] = useState({
    user_id: "",
    nickname: "",
    email: "",
    region: "",
    subRegion: "",
    diseases: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [subRegions, setSubRegions] = useState({});
  const [loading, setLoading] = useState(false); // 로딩 상태 관리
  const navigate = useNavigate();

  const diseasesList = ["천식", "알레르기", "폐 질환", "암", "당뇨병", "신장 질환", "관절염", "골다공증", "알츠하이머", "백내장", "파킨슨병", "심장 질환"];

  // 사용자 정보 및 지역 데이터 불러오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/mypage/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const [region, subRegion = ""] = data.data.region.split(" ");
          setFormData({
            ...data.data,
            region,
            subRegion,
            diseases: data.data.diseases !== null ? data.data.diseases.split(",") : "",
          });
        } else {
          setError("사용자 정보를 불러오는 데 실패했어요.");
        }
      } catch (err) {
        //console.error("데이터를 불러오는데 실패했어요.:", err);
        setError("데이터를 불러오는데 실패했어요." + err);
      }
    };

    const fetchRegionData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/getAddressInfo`);
        if (response.ok) {
          const data = await response.json();
          setSubRegions(data.data);
        } else {
          setError("지역 데이터를 불러오는 데 실패했어요.");
        }
      } catch (err) {
        // console.error("지역 데이터를 불러오는데 실패했어요.", err);
        setError("지역 데이터를 불러오는 데 실패했어요.");
      }
    };

    fetchUserData();
    fetchRegionData();
  }, []);

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      if (name === "region") {
        return { ...prevData, region: value, subRegion: "" };
      }
      return { ...prevData, [name]: value };
    });
  };

  // 질병 선택 핸들러
  const handleDiseaseChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => {
      const updatedDiseases = checked
        ? [...prevData.diseases, value]
        : prevData.diseases.filter((disease) => disease !== value);
      return { ...prevData, diseases: updatedDiseases };
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); // 로딩 상태 시작
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          region: formData.subRegion ? `${formData.region} ${formData.subRegion}` : formData.region,
          diseases: Array.isArray(formData.diseases) && formData.diseases.length > 0 
          ? formData.diseases.filter(Boolean).join(',') // 빈 값 제거 후 결합
          : '', // 모든 체크박스가 해제되면 빈 문자열 처리
        }),
      });

      const city = formData.region;
      const region = formData.subRegion;
      const regionData = { city, region };

      sessionStorage.setItem("regionData", JSON.stringify(regionData));

      // dustdata.js로 이동하여 state 전달
      navigate("/dustdata", { state: regionData });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/mypage"), 3000);
      } else {
        setError("정보를 업데이트하는 데 실패했어요.");
      }
    } catch (err) {
      console.error("업데이트 요청 중 오류가 발생했어요.:", err);
      setError("업데이트 요청 중 오류가 발생했어요.");
    } finally {
      setTimeout(() => {setLoading(false)}, 3000);
    }
  };

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  return (
    <div className="update-container">
      <h1>정보 수정</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="user_id">아이디:</label>
          <input type="text" id="user_id" name="userId" value={formData.user_id} readOnly />
        </div>
        <div className="form-group">
          <label htmlFor="nickname">닉네임:</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">이메일:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="region">관측소 지역:</label>
          <select
            id="region"
            name="region"
            value={formData.region}
            onChange={handleInputChange}
            disabled={loading}
            required
          >
            <option value="">관측소 지역을 선택하세요</option>
            {Object.keys(subRegions).map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
        {formData.region && subRegions[formData.region] && (
          <div className="form-group">
            <label htmlFor="subRegion">관측소 세부지역:</label>
            <select
              id="subRegion"
              name="subRegion"
              value={formData.subRegion}
              onChange={handleInputChange}
              disabled={loading}
              required
            >
              <option value="">세부 지역을 선택하세요</option>
              {subRegions[formData.region].map((subRegion) => (
                <option key={subRegion} value={subRegion}>
                  {subRegion}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="diseases">질병:</label>
          <div className="checkbox-group">
            {diseasesList.map((disease) => (
              <label key={disease}>
                <input
                  type="checkbox"
                  name="diseases"
                  value={disease}
                  checked={formData.diseases.includes(disease)}
                  onChange={handleDiseaseChange}
                  disabled={loading}
                />
                {disease}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">정보가 성공적으로 수정되었어요.</p>}
        <button type="submit" disabled={loading}>
          {loading ? "업데이트 중..." : "수정"}
        </button>
      </form>
    </div>
  );
}

export default Update;