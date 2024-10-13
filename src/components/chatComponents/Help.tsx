"use client";

import { Card, CardBody, Tab, Tabs } from "@nextui-org/react";
import WeatherWidget from "../WeatherWidget";
import useReadingLists from "@/hooks/useReadingLists";
import { useEffect, useState } from "react";
import axios from "axios";
import useSuggestedLinks from "@/hooks/useSuggestedLinks";
import { FaPiggyBank } from "react-icons/fa";

const HelpComponent = ({ setIsLoading }: Readonly<{ setIsLoading: any }>) => {
  const { readingLists, isLoadingLists, lastListOrderValue } =
    useReadingLists();
  const { suggestedLinks, isLoadingLinks, lastLinkOrderValue } =
    useSuggestedLinks();

  const [weather, setWeather] = useState<any | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const fetchWeather = async (latitude: number, longitude: number) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPEN_WEATHER_API_KEY;

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
      );
      setWeather(response.data);
      setIsLoading(false);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
          // Set up polling to fetch weather data every 10 minutes
          const id = setInterval(() => {
            fetchWeather(latitude, longitude);
          }, 600000); // 600000 ms = 10 minutes
          setIntervalId(id);
        },
        (error) => {
          console.error(error);
          // Use default coordinates for Bunawan City if location access is denied
          const defaultLatitude = 8.1575;
          const defaultLongitude = 125.9938;
          fetchWeather(defaultLatitude, defaultLongitude);
          // Set up polling to fetch weather data every 10 minutes
          const id = setInterval(() => {
            fetchWeather(defaultLatitude, defaultLongitude);
          }, 600000); // 600000 ms = 10 minutes
          setIntervalId(id);
        }
      );
    } else {
      // Use default coordinates for Bunawan City if geolocation is not supported
      const defaultLatitude = 8.1575;
      const defaultLongitude = 125.9938;
      fetchWeather(defaultLatitude, defaultLongitude);
      // Set up polling to fetch weather data every 10 minutes
      const id = setInterval(() => {
        fetchWeather(defaultLatitude, defaultLongitude);
      }, 600000); // 600000 ms = 10 minutes
      setIntervalId(id);
    }
  };

  useEffect(() => {
    getLocation();

    // Clear interval on component unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <div className="h-full w-full grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-5 overflow-auto relative">
      <div className="flex flex-col gap-6">
        {weather && <WeatherWidget weather={weather} />}

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Suggested Links</h2>

          {!isLoadingLinks &&
            suggestedLinks.length > 0 &&
            suggestedLinks.map((list, index) => (
              <div
                key={index}
                className="w-full border border-[#007057] text-[#007057] text-start p-4 rounded-xl flex items-start justify-start gap-2 cursor-pointer"
                onClick={() => window.open(list.link_url, "_blank")}
              >
                <FaPiggyBank className="text-2xl flex-shrink-0" />
                <div className="truncate flex-grow">{list.link_name}</div>
              </div>
            ))}
        </div>
      </div>
      <div className="h-[80svh] lg:h-full w-full flex flex-col gap-2 overflow-x-auto">
        <h2 className="text-2xl font-bold text-gray-800">Reading List</h2>
        <Tabs
          aria-label="Dynamic tabs"
          color="default"
          radius="full"
          items={readingLists}
        >
          {(item) => (
            <Tab key={item.list_id} title={item.file_name} className="h-full">
              <Card className="h-full">
                <CardBody className="p-0 m-0">
                  <iframe
                    src={item.file_url}
                    className="w-full h-full"
                    title={item.file_name}
                  />
                </CardBody>
              </Card>
            </Tab>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default HelpComponent;
