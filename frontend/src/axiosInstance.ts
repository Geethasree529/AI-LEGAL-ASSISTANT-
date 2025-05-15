import axios, { AxiosInstance } from "axios";

const host:string = "localhost"

const axiosInstance: AxiosInstance = axios.create({
  baseURL:`http://${host}:8000`,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

export default axiosInstance;
