import type { EmployeeRosterItem } from "@/types";

export const mockEmployeeRoster: EmployeeRosterItem[] = [
  { id: "emp1", department: "개발팀", name: "김철수", employeeId: "E001", commuteTransport: "public", address: "서울시 강남구 테헤란로 123" },
  { id: "emp2", department: "마케팅팀", name: "이영희", employeeId: "E002", commuteTransport: "car", fuel: "휘발유", address: "경기도 성남시 분당구 판교로 456" },
  { id: "emp3", department: "개발팀", name: "박지훈", employeeId: "E003", commuteTransport: "ev", address: "서울시 서초구 서초대로 11" },
  { id: "emp4", department: "인사팀", name: "정수진", employeeId: "E004", commuteTransport: "walk_bike", address: "서울시 마포구 양화로 9" },
  { id: "emp5", department: "기획팀", name: "최민호", employeeId: "E005", commuteTransport: "car", fuel: "경유", address: "인천시 연수구 송도과학로 77" },
];
