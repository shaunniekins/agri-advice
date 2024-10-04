"use client";

import { insertChatConnection } from "@/app/api/chatConnectionsIUD";
import { insertChatMessage } from "@/app/api/chatMessagesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useChatConnections from "@/hooks/useChatConnections";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Tab,
  Tabs,
  Textarea,
} from "@nextui-org/react";
import axios from "axios";
import { useRouter } from "next/navigation";
import React from "react";
import { useEffect, useRef, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaPiggyBank } from "react-icons/fa";
import { GiChoice } from "react-icons/gi";
import { IoAddSharp, IoSendOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import WeatherWidget from "../WeatherWidget";
import useUsers from "@/hooks/useUsers";
import usePremadePrompts from "@/hooks/usePremadePrompts";

const ChatPageComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);

  const [page, setPage] = useState(1);
  const rowsPerPage = 9;

  const [messageInput, setMessageInput] = useState("");
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [chosenTechnicianId, setChosenTechnicianId] = useState<string | null>(
    null
  );
  const [openTechnicianModal, setOpenTechnicianModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const {
    usersData,
    isLoadingUsers,
    totalUserEntries,
    fetchAndSubscribeUsers,
  } = useUsers(rowsPerPage, page, "technician", "active");

  const totalPages = Math.ceil(totalUserEntries / rowsPerPage);

  useEffect(() => {
    if (!isLoadingUsers) {
      setIsLoading(false);
    }
  }, [isLoadingUsers]);

  const { premadePrompts, isLoadingPrompts } = usePremadePrompts();

  const handleSubmit = async () => {
    // insert chat connection
    const response = await insertChatConnection({
      farmer_id: user.id,
      technician_id: chosenTechnicianId,
    });

    if (!response) {
      console.error("Error inserting chat connection");
      return;
    }

    insertChatMessage({
      sender_id: user.id,
      receiver_id: chosenTechnicianId,
      message: messageInput,
    });

    setIsLoading(true);
    setChosenTechnicianId(null);
    setMessageInput("");

    // router.push(`/farmer/chat/${response.data[0].chat_connection_id}`);
    router.push(
      `/${userType}/chat/id?sender=${user.id}&receiver=${chosenTechnicianId}`
    );
  };

  //   technician
  const [userType, setUserType] = useState("");

  useEffect(() => {
    if (user && user.user_metadata) {
      setUserType(user.user_metadata.user_type);
    }
  }, [user]);

  const pdfFiles = [
    {
      id: 1,
      label: "Preparation Guidelines",
      src: "/reading-list/preparation-guidelines.pdf",
    },
    {
      id: 2,
      label: "Implementation Guidelines",
      src: "/reading-list/implementation-guidelines.pdf",
    },
    { id: 3, label: "GAHP Swine", src: "/reading-list/gahp-swine.pdf" },
  ];

  const [weather, setWeather] = useState<any | null>(null);

  useEffect(() => {
    if (userType !== "technician") return;

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
            const intervalId = setInterval(() => {
              fetchWeather(latitude, longitude);
            }, 600000); // 600000 ms = 10 minutes

            // Clear interval on component unmount
            return () => clearInterval(intervalId);
          },
          (error) => {
            console.error(error);
            // Use default coordinates for Bunawan City if location access is denied
            const defaultLatitude = 8.1575;
            const defaultLongitude = 125.9938;
            fetchWeather(defaultLatitude, defaultLongitude);
            // Set up polling to fetch weather data every 10 minutes
            const intervalId = setInterval(() => {
              fetchWeather(defaultLatitude, defaultLongitude);
            }, 600000); // 600000 ms = 10 minutes

            // Clear interval on component unmount
            return () => clearInterval(intervalId);
          }
        );
      } else {
        // Use default coordinates for Bunawan City if geolocation is not supported
        const defaultLatitude = 8.1575;
        const defaultLongitude = 125.9938;
        fetchWeather(defaultLatitude, defaultLongitude);
        // Set up polling to fetch weather data every 10 minutes
        const intervalId = setInterval(() => {
          fetchWeather(defaultLatitude, defaultLongitude);
        }, 600000); // 600000 ms = 10 minutes

        // Clear interval on component unmount
        return () => clearInterval(intervalId);
      }
    };

    getLocation();
  }, [userType]);

  if (userType === "technician") {
    return (
      <div className="h-full w-full grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-5 overflow-auto relative">
        <div>{weather && <WeatherWidget weather={weather} />}</div>
        <div className="h-full w-full flex flex-col gap-2 overflow-x-auto">
          <h2 className="text-2xl font-bold text-gray-800">Reading List</h2>
          <Tabs
            aria-label="Dynamic tabs"
            color="default"
            radius="full"
            items={pdfFiles}
          >
            {(item) => (
              <Tab key={item.id} title={item.label} className="h-full">
                <Card className="h-full">
                  <CardBody className="p-0 m-0">
                    <iframe
                      src={item.src}
                      className="w-full h-full"
                      title={item.label}
                    />
                  </CardBody>
                </Card>
              </Tab>
            )}
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal
        backdrop="blur"
        // isDismissable={!chosenTechnicianId}
        isOpen={openTechnicianModal}
        hideCloseButton={true}
        // onOpenChange ? !onclose : onClose
        onOpenChange={setOpenTechnicianModal}
        // onClose={() => {
        //   if (chosenTechnicianId) {
        //     const confirmClose = window.confirm(
        //       "You have selected a technician. Do you want to close and remove the selection?"
        //     );
        //     if (confirmClose) {
        //       setChosenTechnicianId(null);
        //       setOpenTechnicianModal(false);
        //     }
        //   } else {
        //     setOpenTechnicianModal(false);
        //   }
        // }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Choose Technician to Answer Your Question
              </ModalHeader>
              <ModalBody>
                <div className="w-full grid grid-cols-3">
                  {usersData.map((item, index) => {
                    const initials = `${item.first_name[0].toUpperCase()}${item.last_name[0].toUpperCase()}`;
                    return (
                      <button
                        key={index}
                        className={`${
                          chosenTechnicianId === item.id
                            ? "border-[#007057]"
                            : ""
                        } border flex flex-col items-center rounded-lg p-2 gap-1 relative`}
                        onClick={() => {
                          setChosenTechnicianId(
                            chosenTechnicianId === item.id ? null : item.id
                          );
                        }}
                      >
                        {/* <button
                          className="absolute right-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('clicked')
                          }}
                        >
                          <BsThreeDotsVertical />
                        </button> */}

                        <Popover showArrow placement="top">
                          <PopoverTrigger>
                            {/* <BsThreeDotsVertical /> */}
                            <button
                              className="absolute right-1"
                              // onClick={(e) => {
                              //   e.stopPropagation();
                              //   alert('clicked')
                              // }}
                            >
                              <BsThreeDotsVertical />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="p-2 flex flex-col items-center gap-1">
                            <h3>{item.email}</h3>
                            <h4 className="text-xs">{item.birth_date}</h4>
                          </PopoverContent>
                        </Popover>
                        {/* <Avatar size="sm" name={initials} showFallback /> */}
                        {!item.profile_picture ? (
                          <Avatar size="sm" name={initials} showFallback />
                        ) : (
                          <Avatar
                            size="sm"
                            src={item.profile_picture}
                            alt="Profile"
                            showFallback
                            className="rounded-full object-cover cursor-pointer"
                          />
                        )}
                        <p className="text-xs">
                          {item.first_name} {item.last_name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="w-full flex justify-between items-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    size="sm"
                    color="success"
                    page={page}
                    total={totalPages}
                    onChange={(newPage) => setPage(newPage)}
                  />
                  <Button
                    isDisabled={!chosenTechnicianId}
                    className="bg-[#007057] text-white self-center"
                    onClick={() => {
                      setOpenTechnicianModal(false);
                    }}
                  >
                    Choose
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Spinner color="success" />
        </div>
      )}
      {!isLoading && (
        <div className="h-full w-full overflow-auto relative">
          <div className="mt-6 mb-8 flex flex-col gap-2">
            <h1 className="text-4xl lg:text-5xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-[#007057] to-yellow-300">
              Kamusta, {""}
              <span className="truncate">
                {user ? user.user_metadata.first_name : "User"}
              </span>
            </h1>
            <h1 className="text-4xl lg:text-5xl font-semibold">
              Unsa imong pangutana?
            </h1>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              radius="full"
              size="sm"
              variant={!chosenTechnicianId ? "ghost" : "flat"}
              color="success"
              startContent={<GiChoice />}
              className="self-start"
              onClick={() => setOpenTechnicianModal(true)}
            >
              {!chosenTechnicianId
                ? "Choose Technician"
                : "You chose a technician"}
            </Button>
            <div className="w-full flex overflow-x-auto custom-scrollbar">
              <div className="flex flex-nowrap gap-2">
                {isLoadingPrompts && (
                  <div className="h-44 w-44 justify-center items-center">
                    <Spinner color="success" />
                  </div>
                )}
                {!isLoadingPrompts &&
                  premadePrompts.length > 0 &&
                  premadePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="relative h-44 w-44 bg-[#007057] text-white text-start px-4 py-2 rounded-xl flex items-start justify-center"
                      onClick={() => setMessageInput(prompt.prompt_message)}
                    >
                      {prompt.prompt_message}
                      <FaPiggyBank className="absolute bottom-4 right-4 text-white text-2xl" />
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="w-full absolute bottom-0 pb-6">
            <Textarea
              size="lg"
              radius="lg"
              maxRows={3}
              minRows={1}
              color="success"
              endContent={
                <div className="flex gap-4 text-2xl">
                  <button
                    className={`${
                      (!messageInput || !chosenTechnicianId) && "hidden"
                    }`}
                    onClick={handleSubmit}
                  >
                    <IoSendOutline />
                  </button>
                </div>
              }
              placeholder="Enter message here"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPageComponent;
