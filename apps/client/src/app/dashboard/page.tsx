import { useUserRole } from "@/hooks/use-user-role";
import AdminDashboard from "@/components/dashboard/admin/admin-dashboard";
import InstructorDashboard from "@/components/dashboard/instructor/instructor-dashboard";
import StudentDashboard from "@/components/dashboard/student/student-dashboard";

export default function DashboardPage() {
  const role = useUserRole();

  if (role === "admin") return <AdminDashboard />;
  if (role === "instructor") return <InstructorDashboard />;
  return <StudentDashboard />;
}
