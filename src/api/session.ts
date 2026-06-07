import { api } from "./client";
import { type Area } from "@/lib/area"

interface createSessionRequest {
    song_id: number,
    mode: string,
    partner_recording_id?: number,
}

interface createSessionResponse {
    "success":boolean,
    "status":number,
    "message":string,
    "code"?:string,
    "meta"?:string,
    "data": {
        "session_id":number,
        "status":string,
        "song_title":string,
        "partner_name"?:string,
        "audio_url"?:string,
    }
}

export const createSession = async (data : createSessionRequest) : Promise<createSessionResponse> => {
    const response = await api.post('/sessions', data);
    console.log(response);
    return response.data;
}

// 세션 중도 종료
export const abortSession = async (session_id : number) => {
    console.log(`session id: ${session_id}`)
    const response = await api.post(`/sessions/${session_id}/abort`);
    console.log(response);
    return response.data;
}

// 세션 종료
export const completeSession = async (
  session_id: number,
  audio: Blob,
  video: Blob
) => {
  const formData = new FormData();

  formData.append('audio', audio, 'audio.webm');
  formData.append('video', video, 'video.webm');

  const response = await api.post(
    `/sessions/${session_id}/complete`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

// 직전 세션 마킹 조회 
export const getPreviousMarking = async (session_id:number) => {
    console.log(`session id: ${session_id}`);
    const response = await api.get(`/sessions/${session_id}/previous-markings`);
    console.log(response);
    return response.data;
}

export interface FeedbackItem {
  domain: string;
  action_id: string;
  feedback: string;
}

export interface Measure {
  measure_index: number;
  current: FeedbackItem[];
  previous: FeedbackItem[];
}

export interface SessionResult {
  session_id: number;
  song_id: number;
  song_title: string;
  played_at: string;
  mode: string;
  partner_name: string;
  measures: Measure[];
}


export type Mark = { area: Area; message?: string };


// 세션 결과 마킹 조회
export const getSessionResult = async (session_id: number) : Promise<SessionResult> => {
<<<<<<< HEAD
  console.log('getSessionResult get session_id: ', session_id);
  const response = await api.get(
=======

    console.log('getSessionResult get session_id: ', session_id);
    const response = await api.get(
>>>>>>> 61cc830205ffb358fac16c5faf278e131db5b46b
    `/sessions/${session_id}/result`
  );
  console.log(response.data);
  return response.data.data;
};