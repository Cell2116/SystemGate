import { useEffect, useState } from "react";
import { utcToIndonesianTime } from "../../lib/timezone";

export default function clock(){
  const [time, setTime] = useState(new Date());

  useEffect(()=>{
    const timer = setInterval(()=> {
      // Mendapatkan waktu Indonesia (UTC+7)
      const now = new Date();
      const indonesianTime = utcToIndonesianTime(now);
      setTime(indonesianTime);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours().toString().padStart(2, "0");
  const minute = time.getMinutes().toString().padStart(2, "0");
  const second = time.getSeconds().toString().padStart(2, "0");

  const formattedTime = `${hour} : ${minute} : ${second}`;

  const formattedDate = time.toLocaleDateString('id-ID',{
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });
  return(
        <div className="bg-gray-600 bg-opacity-5 shadow-md rounded-xl p-2 w-full max-w-sm ">
    <span>
      <span className="text-xs mb-0 md:text-sm xl:text-sm font-semibold text-gray-500 md:mb-2 xl:mb-2">{formattedDate} | </span>
      <span className="text-xs mb-0 md:text-sm xl:text-sm font-semibold text-black-600 md:mb-2 xl:mb-2">{formattedTime}</span>
      </span>
    </div>
  )
}