import { notFound } from "next/navigation";

import { BackLink } from "@/components/admin/ui";
import { getMemberDetail } from "@/lib/crm";

import { EditMemberForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getMemberDetail(id);
  if (!detail) notFound();

  const { member, guardian, emergency, secondContact, medical, groups } = detail;

  return (
    <div className="space-y-6">
      <BackLink href={`/admin/adherentes/${member.id}`}>Retour à la fiche</BackLink>

      <header>
        <h1 className="text-2xl font-bold text-brand-dark">
          Modifier {member.firstName} {member.lastName.toUpperCase()}
        </h1>
        <p className="mt-1 font-mono text-sm text-brand">{member.memberNumber}</p>
      </header>

      <EditMemberForm
        memberId={member.id}
        groups={groups}
        initial={{
          firstName: member.firstName,
          lastName: member.lastName,
          birthDate: member.birthDate,
          schoolLevel: member.schoolLevel,
          schoolName: member.schoolName ?? "",
          groupName: member.groupName,
          guardianFirstName: guardian?.firstName ?? "",
          guardianLastName: guardian?.lastName ?? "",
          guardianPhone: guardian?.phone ?? "",
          guardianEmail: guardian?.email ?? "",
          emergencyFirstName: emergency?.firstName ?? "",
          emergencyLastName: emergency?.lastName ?? "",
          emergencyPhone: emergency?.phone ?? "",
          emergencyRelationship: emergency?.relationship ?? "",
          secondFirstName: secondContact?.firstName ?? "",
          secondPhone: secondContact?.phone ?? "",
          secondRelationship: secondContact?.relationship ?? "",
          allergies: medical?.allergies ?? "",
          currentTreatments: medical?.currentTreatments ?? "",
          healthNotes: medical?.healthNotes ?? "",
        }}
      />
    </div>
  );
}
