import React from "react";
import {
  differenceInYears,
  format,
  isThisWeek,
  isToday,
  isYesterday,
  subDays,
} from "date-fns";
import ReactMarkdown from "react-markdown";

// Function to extract ID from pathname
export const getIdFromPathname = (pathname: string) => {
  const segments = pathname.split("/");
  return segments[segments.length - 1];
};

export const calculateAge = (birthDate: string): number => {
  const birthDateObj = new Date(birthDate);
  const currentDate = new Date();
  return differenceInYears(currentDate, birthDateObj);
};

export const formatMessageTime = (date: any) => {
  const parsedDate = new Date(date);
  return format(parsedDate, "h:mm a");
};

export const renderMessage = (message: string) => {
  const imageUrlPattern =
    /https:\/\/vgckngozsjzlzkrntaoq\.supabase\.co\/storage\/v1\/object\/public\/chat-images\/[^"]+/;

  const match = message.match(imageUrlPattern);

  if (match) {
    const imageUrl = match[0]; // Extract the matched URL
    return (
      <img
        src={imageUrl}
        alt="Message Image"
        style={{ maxWidth: "100%", maxHeight: "200px" }}
      />
    );
  } else {
    return <ReactMarkdown>{message}</ReactMarkdown>;
  }
};

export const formatMessageDate = (date: any) => {
  const parsedDate = new Date(date);
  const now = new Date();

  if (isToday(parsedDate)) {
    return `TODAY AT ${format(parsedDate, "h:mm a")}`;
  } else if (isYesterday(parsedDate)) {
    return `YESTERDAY AT ${format(parsedDate, "h:mm a")}`;
  } else if (isThisWeek(parsedDate)) {
    return `${format(parsedDate, "EEE")} AT ${format(parsedDate, "h:mm a")}`;
  } else if (parsedDate > subDays(now, 5)) {
    return `${format(parsedDate, "EEE")} AT ${format(parsedDate, "h:mm a")}`;
  } else {
    return `${format(parsedDate, "dd MMM")} AT ${format(parsedDate, "h:mm a")}`;
  }
};
