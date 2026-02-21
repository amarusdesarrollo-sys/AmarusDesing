import { getTeamMembers } from "@/lib/firebase/team";
import { getEquipoCierreContent } from "@/lib/firebase/content";
import EquipoFromCms from "@/components/EquipoFromCms";
import EquipoStatic from "@/components/EquipoStatic";

export default async function EquipoPage() {
  const [members, cierre] = await Promise.all([
    getTeamMembers().catch(() => []),
    getEquipoCierreContent().catch(() => null),
  ]);

  if (members.length > 0 && cierre) {
    return <EquipoFromCms members={members} cierre={cierre} />;
  }

  return <EquipoStatic />;
}
