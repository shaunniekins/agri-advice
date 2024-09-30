import React from "react";
import { Card, CardBody } from "@nextui-org/react";
import { Sun, Cloud, Droplets, Wind } from "lucide-react";

interface Weather {
  name: string;
  weather: { description: string }[];
  main: { temp: number; humidity: number };
  wind: { speed: number };
}

interface WeatherWidgetProps {
  weather: Weather | null;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  if (!weather) return null;

  const getWeatherIcon = (description: string) => {
    switch (description.toLowerCase()) {
      case "clear sky":
        return <Sun className="w-12 h-12 text-yellow-400" />;
      case "few clouds":
      case "scattered clouds":
      case "broken clouds":
      case "overcast clouds":
        return <Cloud className="w-12 h-12 text-gray-400" />;
      default:
        return <Cloud className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg">
      <CardBody className="p-6">
        <div className="flex justify-between items-center mb-4">
          {/* <h2 className="text-2xl font-bold text-gray-800">Current</h2> */}
          <h2 className="text-2xl font-bold text-gray-800">{weather.name}</h2>
          {getWeatherIcon(weather.weather[0].description)}
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="text-4xl font-bold text-gray-800">
              {Math.round(weather.main.temp)}°C
            </span>
            <span className="ml-2 text-lg text-gray-600 capitalize">
              {weather.weather[0].description}
            </span>
          </div>
          <div className="flex items-center text-gray-700">
            <Droplets className="w-5 h-5 mr-2" />
            <span>Humidity: {weather.main.humidity}%</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Wind className="w-5 h-5 mr-2" />
            <span>Wind: {weather.wind.speed} m/s</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default WeatherWidget;
