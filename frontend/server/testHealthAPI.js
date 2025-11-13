import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
    stages: [
        { duration: "10s", target: 10 },
        { duration: "30s", target: 100 },
        { duration: "10s", target: 0 },
    ],
};

// const BASE_URL = "http://192.168.4.108:3000";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const endpoints = [
    { method: "GET", url: "/logs" },
    { method: "GET", url: "/users" },
    { method: "GET", url: "/leave-permission" },
    // { method: "GET", url: "/api/users" },
    // { method: "POST", url: "/api/login", body: { username: "test", password: "123" } },
    // { method: "GET", url: "/api/devices" },
];

export default function () {
    const randomAPI = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res =
        randomAPI.method === "POST"
            ? http.post(BASE_URL + randomAPI.url, JSON.stringify(randomAPI.body), {
                headers: { "Content-Type": "application/json" },
            })
            : http.get(BASE_URL + randomAPI.url);

    check(res, {
        "status 200": (r) => r.status === 200,
    });

    sleep(1);
}
