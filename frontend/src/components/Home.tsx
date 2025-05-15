import React, { useState, useRef, useEffect } from "react";
import "./Home.css";
import axiosInstance from "../axiosInstance";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  type: "text" | "pdf" | "response";
  content: string;
}

interface UploadResponse {
  id: string;
  pdf_file: string;
}

interface MessageResponse {
  response: string;
}

interface HistoryEntry {
  role: string;
  parts: string[];
}

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [id, setId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const idRef = useRef<string>(id);

  useEffect(() => {
    idRef.current = id;
  }, [id]);

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadPDF = async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append("pdf_file", file);
      const response = await axiosInstance.post<UploadResponse>(
        "/pdf/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw new Error(`Error uploading PDF: ${error}`);
    }
  };

  const sendMessage = async (
    msg: string,
    history: HistoryEntry[]
  ): Promise<MessageResponse> => {
    try {
      const payload = {
        message: msg,
        history: history,
      };
      const response = await axiosInstance.post<MessageResponse>(
        `/pdf/${id}/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw new Error(`Error uploading PDF: ${error}`);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const result = await uploadPDF(file);
        setId(result.id);
      } catch (error) {
        console.error("Upload failed:", error);
      }
      processPDF(file);
    }
  };

  const processPDF = (file: File) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        const pdfMessage: Message = {
          type: "pdf",
          content: e.target.result,
        };
        setMessages((prevMessages) => [...prevMessages, pdfMessage]);
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
          chatRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      }
    };
    fileReader.readAsDataURL(file);
  };

  const handleMessageSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputRef.current && inputRef.current.value.trim() !== "") {
      const newMessage: Message = {
        type: "text",
        content: inputRef.current.value.trim(),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      inputRef.current.value = "";
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }
  };

  const prephistory = (msgs: Message[]): HistoryEntry[] => {
    const history: HistoryEntry[] = [];
    msgs.map((msg) => {
      if (msg.type === "text") {
        history.push({ role: "user", parts: [msg.content] });
      } else if (msg.type === "response") {
        history.push({ role: "model", parts: [msg.content] });
      }
    });
    return history;
  };

  useEffect(() => {
    const handleMessage = async () => {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.type === "text") {
          const history: HistoryEntry[] = prephistory(messages);
          history.pop();

          setLoading(true);
          try {
            const res: MessageResponse = await sendMessage(
              lastMessage.content,
              history
            );
            const msg: Message = {
              type: "response",
              content: String(res.response),
            };
            setMessages((prevMessages) => [...prevMessages, msg]);
          } catch (error) {
            const msg: Message = {
              type: "response",
              content: "Failed to send message",
            };
            setMessages((prevMessages) => [...prevMessages, msg]);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    handleMessage();
  }, [messages]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      await axiosInstance.delete(`/pdf/${idRef.current}/delete/`);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="container">
      <header>
        <h1 className="head">Legal Document Analysis</h1>
      </header>
      <main className="parent">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileSelect}
          accept=".pdf"
        />
        <section className="chat" ref={chatRef}>
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              {message.type === "text" ? (
                <p>{message.content}</p>
              ) : message.type === "pdf" ? (
                <embed
                  src={message.content}
                  type="application/pdf"
                  width="200px"
                  height="300px"
                />
              ) : message.type === "response" ? (
                <div className="response">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>Unsupported message type</p>
              )}
            </div>
          ))}
          {loading && (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        )}
        </section>
      </main>
        <div className="inp">
          <form onSubmit={handleMessageSubmit}>
            <input type="text" ref={inputRef} placeholder="Enter Prompt" />
            <button type="submit" className="send">
              Send
            </button>
            <button onClick={handleUpload} className="send">
              Upload PDF
            </button>
          </form>
        </div>
    </div>
  );
};

export default Home;

