import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadImageToStorage(file: File) {
  // 파일 경로를 지정합니다.
  const storageRef = ref(storage, `events/${Date.now()}_${file.name}`);

  // Storage에 파일 업로드
  const snapshot = await uploadBytes(storageRef, file);

  // 업로드된 파일의 다운로드 URL 가져오기
  const downloadURL = await getDownloadURL(snapshot.ref);
  console.log("///downloadURL", downloadURL);
  return downloadURL; // 이 URL을 Firestore에 저장해야 합니다.
}
