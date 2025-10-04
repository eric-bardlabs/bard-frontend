"use client";

import { Dropzone } from "@/components/ui/Dropzone";
import { useState } from "react";

import { FlatProgress } from "@/components/FlatProgress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation } from "@tanstack/react-query";
import { useOrganization } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import type { InputProps } from "@heroui/react";

import React from "react";
import { Input, Checkbox, Link } from "@heroui/react";

export type ImportCollaboratorsProps = React.HTMLAttributes<HTMLFormElement>;

const ImportCollaborators = React.forwardRef<
  HTMLFormElement,
  ImportCollaboratorsProps
>(({ className, ...props }, ref) => {
  const [files, setFiles] = useState<File[]>([]);

  const inputProps: Pick<InputProps, "labelPlacement" | "classNames"> = {
    labelPlacement: "outside",
    classNames: {
      label:
        "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
    },
  };

  const uploadFiles = async (files: File[]): Promise<any> => {
    console.log("Finished!");
    //   const formData = new FormData();

    //   files.forEach((file, index) => {
    //     formData.append(`file${index}`, file);
    //   });

    //   const response = await fetch("/api/upload", {
    //     method: "POST",
    //     body: formData,
    //   });

    //   if (!response.ok) {
    //     throw new Error("File upload failed");
    //   }
    //   return response.json(); // Adjust this based on the response from your server
  };

  const mutation = useMutation({
    mutationFn: uploadFiles,
    onSuccess: (data) => {
      // Handle successful upload
      console.log("Files uploaded successfully", data);
    },
    onError: (error) => {
      // Handle any errors
      console.error("Error uploading files", error);
    },
  });
  return (
    <div className="flex flex-col pt-4 items-center ">
      <div className="w-full  md:max-w-[800px] flex-1 flex flex-col gap-4">
        <h1 className="text-[24px] md:text-[36px]">
          Upload Collaborators via CSV
        </h1>
        <Dropzone
          onChange={setFiles}
          onFilesDropped={(files) => {
            mutation.mutate(files);
          }}
          className="w-full h-[400px]"
          fileExtension=".csv"
          footerTextOverride={
            <Link href="https://aeslquagrnbfuuztoayk.supabase.co/storage/v1/object/public/template_files/Bard%20-%20Import%20template%20-%20Collaborators.csv">
              <a download>Download CSV Template</a>
            </Link>
          }
        />

        {files.length > 0 && (
          <div className="flex flex-col items-start">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Files uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow key={index}>
                    <TableCell>{file.name}</TableCell>
                    <TableCell>
                      <FlatProgress />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
});

ImportCollaborators.displayName = "Import your Collaborators";

export default ImportCollaborators;
