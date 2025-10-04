import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Tooltip,
  Progress,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { CollaboratorSingleSelect } from "@/components/collaborator/CollaboratorSingleSelect";
import { CollaboratorSelection } from "@/components/collaborator/types";

export type SplitRow = {
  id: string;
  collaboratorName?: string;
  collaboratorEmail?: string;
  songwriting: string | number;
  publishing: string | number;
  master: string | number;
};

type SplitsTableProps = {
  splitRows: SplitRow[];
  onSplitRowChange: (index: number, field: string, value: string | number | { id: string; name: string; email: string }) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  totals: {
    songwriting: number;
    publishing: number;
    master: number;
  };
};

export const SplitsTable: React.FC<SplitsTableProps> = ({
  splitRows,
  onSplitRowChange,
  onAddRow,
  onRemoveRow,
  totals,
}) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  return (
    <div className="flex flex-col w-full">
      <div className="border border-divider rounded-medium overflow-hidden">
        <Table removeWrapper aria-label="Collaborator splits table">
          <TableHeader>
            <TableColumn className="w-1/4">COLLABORATOR</TableColumn>
            <TableColumn className="w-1/4">
              <div className="flex items-center gap-1">
                <span>SONGWRITING</span>
                <Tooltip content="Rights for composing the song">
                  <Icon
                    icon="lucide:info"
                    className="text-default-400 text-sm"
                  />
                </Tooltip>
              </div>
            </TableColumn>
            <TableColumn className="w-1/4">
              <div className="flex items-center gap-1">
                <span>PUBLISHING</span>
                <Tooltip content="Rights for distributing the composition">
                  <Icon
                    icon="lucide:info"
                    className="text-default-400 text-sm"
                  />
                </Tooltip>
              </div>
            </TableColumn>
            <TableColumn className="w-1/4">
              <div className="flex items-center gap-1">
                <span>MASTER</span>
                <Tooltip content="Rights for the sound recording">
                  <Icon
                    icon="lucide:info"
                    className="text-default-400 text-sm"
                  />
                </Tooltip>
              </div>
            </TableColumn>
            <TableColumn className="w-1/8">ACTION</TableColumn>
          </TableHeader>
          <TableBody>
            {[
              splitRows.map((split, idx) => {
                // Create collaborator option from current split if it has an ID
                const currentSelected: CollaboratorSelection | null = split.id ? {
                  id: split.id,
                  label: split.collaboratorName || split.id,
                  subtitle: split.collaboratorEmail || "",
                } : null;
                
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CollaboratorSingleSelect
                          key={`${idx}-${split.id}`}
                          variant="compact"
                          defaultSelected={currentSelected}
                          setSelected={(collaborator) => {
                            if (collaborator) {
                              // Update ID, name, and email all at once
                              onSplitRowChange(idx, "collaborator", {
                                id: collaborator.id,
                                name: collaborator.label,
                                email: collaborator.subtitle || ""
                              });
                            } else {
                              // Clear collaborator
                              onSplitRowChange(idx, "collaborator", {
                                id: "",
                                name: "",
                                email: ""
                              });
                            }
                          }}
                          title="Select..."
                          placeholder="Search collaborators..."
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        size="sm"
                        min={0}
                        max={100}
                        value={inputValues[`${idx}-songwriting`] ?? (split.songwriting?.toString() || "")}
                        onValueChange={(value) => {
                          setInputValues(prev => ({ ...prev, [`${idx}-songwriting`]: value }));
                          onSplitRowChange(
                            idx,
                            "songwriting",
                            value === "" ? 0 : Number(value)
                          );
                        }}
                        onBlur={() => {
                          // Clear the local input value when focus is lost
                          setInputValues(prev => {
                            const newValues = { ...prev };
                            delete newValues[`${idx}-songwriting`];
                            return newValues;
                          });
                        }}
                        endContent={
                          <div className="pointer-events-none">%</div>
                        }
                        classNames={{
                          inputWrapper: "h-8",
                          input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        size="sm"
                        min={0}
                        max={100}
                        value={inputValues[`${idx}-publishing`] ?? (split.publishing?.toString() || "")}
                        onValueChange={(value) => {
                          setInputValues(prev => ({ ...prev, [`${idx}-publishing`]: value }));
                          onSplitRowChange(
                            idx,
                            "publishing",
                            value === "" ? 0 : Number(value)
                          )
                        }}
                        onBlur={() => {
                          setInputValues(prev => {
                            const newValues = { ...prev };
                            delete newValues[`${idx}-publishing`];
                            return newValues;
                          });
                        }}
                        endContent={
                          <div className="pointer-events-none">%</div>
                        }
                        classNames={{
                          inputWrapper: "h-8",
                          input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        size="sm"
                        min={0}
                        max={100}
                        value={inputValues[`${idx}-master`] ?? (split.master?.toString() || "")}
                        onValueChange={(value) => {
                          setInputValues(prev => ({ ...prev, [`${idx}-master`]: value }));
                          onSplitRowChange(
                            idx,
                            "master",
                            value === "" ? 0 : Number(value)
                          )
                        }}
                        onBlur={() => {
                          setInputValues(prev => {
                            const newValues = { ...prev };
                            delete newValues[`${idx}-master`];
                            return newValues;
                          });
                        }}
                        endContent={
                          <div className="pointer-events-none">%</div>
                        }
                        classNames={{
                          inputWrapper: "h-8",
                          input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => onRemoveRow(idx)}
                      >
                        <Icon icon="lucide:trash-2" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }),
              <TableRow key="add-row" className="border-t border-divider">
                <TableCell>
                  <Button
                    variant="flat"
                    onPress={onAddRow}
                    size="sm"
                    startContent={<Icon icon="lucide:plus" />}
                  >
                    Add Collaborator
                  </Button>
                </TableCell>
                <TableCell colSpan={4}>
                  <div className="text-default-400 text-sm"></div>
                </TableCell>
              </TableRow>,
              <TableRow
                className="bg-default-50 font-medium"
                key="totals"
              >
                <TableCell>TOTAL</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label="Songwriting total"
                      value={totals.songwriting}
                      color={totals.songwriting === 100 ? "success" : "warning"}
                      size="sm"
                      className="max-w-md"
                    />
                    <span className="text-sm">{totals.songwriting}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label="Publishing total"
                      value={totals.publishing}
                      color={totals.publishing === 100 ? "success" : "warning"}
                      size="sm"
                      className="max-w-md"
                    />
                    <span className="text-sm">{totals.publishing}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      aria-label="Master total"
                      value={totals.master}
                      color={totals.master === 100 ? "success" : "warning"}
                      size="sm"
                      className="max-w-md"
                    />
                    <span className="text-sm">{totals.master}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div></div>
                </TableCell>
              </TableRow>,
            ].flat()}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};