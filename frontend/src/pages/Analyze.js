import React, { useEffect, useState } from 'react';

function Analyze() {

    // AI response 가져오기
    const [analy, setAnaly]=useState('test');
    useEffect(()=>{
        fetch('http://127.0.0.1:8000/analyze/compact/12&cancer',{
            method:'GET'
            }
        )
        .then(res=>res.json())
        .then(json=>{setAnaly(json);
            console.log(json)
        })
        .catch(err=>{
            console.log(err);})
    },[]);
    
  return (
    <article class="container">
      <section class="content">
         <p>{analy.response ? analy.response : "실외활동 시 특별히 행동에 제한 받을 필요 없지만 '민감군'의 경우 특별히 개인별 건강상태에 따라 유의하며 활동해야 합니다."}</p>
      </section>
    </article>
  )
}

export default Analyze