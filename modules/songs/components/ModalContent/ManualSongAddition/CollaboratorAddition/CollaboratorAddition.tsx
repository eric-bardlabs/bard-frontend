import React, { useState } from 'react';
import { Button, Input, InputDropdown } from '@/components/uikit';

interface Props {
  cancelCollaboratorAddition: (arg: boolean) => void;
}

export const CollaboratorAddition = ({ cancelCollaboratorAddition }: Props) => {
  const [collaboratorData, setCollaboratorData] = useState({
    legalName: '',
    artistName: '',
    organization: '',
    email: '',
    role: '',
  });

  const collaboratorRoles = ['Role 1', 'Role 2', 'Role 3'];

  return (
    <div className="flex flex-col h-full xs:w-[210px] md:w-[400px]">
      <h2>Fill in collaborator info:</h2>
      <div className="flex flex-col gap-[15px] h-full mt-[20px]">
        <Input
          type="text"
          label="Legal Name"
          labelFor="Collaborator Name"
          placeholder="Enter Legal Name"
          value={collaboratorData.legalName}
          setValue={(legalName) => setCollaboratorData({ ...collaboratorData, legalName })}
          required
        />
        <Input
          type="text"
          label="Artist Name"
          labelFor="Artist Name"
          placeholder="Enter Artist Name"
          value={collaboratorData.artistName}
          setValue={(artistName) => setCollaboratorData({ ...collaboratorData, artistName })}
          required
        />
        <Input
          type="text"
          label="Organization"
          labelFor="Organization"
          placeholder="Enter Organization"
          value={collaboratorData.organization}
          setValue={(organization) => setCollaboratorData({ ...collaboratorData, organization })}
          required
        />
        <InputDropdown
          label="Roles:"
          placeholder="Choose role"
          values={collaboratorRoles}
          setValue={(role) => setCollaboratorData({ ...collaboratorData, role })}
        />
        <Input
          type="text"
          label="Email"
          labelFor="Email"
          placeholder="Enter Email"
          value={collaboratorData.email}
          setValue={(email) => setCollaboratorData({ ...collaboratorData, email })}
          required
        />
        <div className="flex flex-row gap-[8px] justify-end">
          <Button text="Back" color="light" onClick={() => cancelCollaboratorAddition(false)} />
          <Button text="Add" color="dark" />
        </div>
      </div>
    </div>
  );
};
