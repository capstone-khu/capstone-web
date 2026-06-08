import { api } from "./client";

export const getAiAnalysis = async (session_id:number) => {
    const res = await api.get(`/sessions/${session_id}/analysis`);
    console.log(res);
    return res.data;
}