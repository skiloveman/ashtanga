import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // 언어 경로(/en/, /ko/ …)에서도 자산이 항상 루트에서 로드되도록 절대 경로 사용
});
