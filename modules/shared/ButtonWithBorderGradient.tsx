"use client";

import React from "react";
import type {ButtonProps, LinkProps} from "@heroui/react";
import {Icon} from "@iconify/react";
import {Button} from "@heroui/react";
import {startsWith} from "lodash";
import Link from "next/link";

export type ButtonWithBorderGradientProps = ButtonProps &
  LinkProps & {
    background?: string;
  };

export const ButtonWithBorderGradient = ({
  children,
  background = "--nextui-background",
  style: styleProp,
  ...props
}: ButtonWithBorderGradientProps) => {
  const linearGradientBg = startsWith(background, "--") ? `hsl(var(${background}))` : background;

  const style = {
    border: "solid 2px transparent",
    backgroundImage: `linear-gradient(${linearGradientBg}, ${linearGradientBg}), linear-gradient(to right, #F871A0, #9353D3)`,
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
  };

  return (
    <Button
      as={Link}
      href="#"
      {...props}
      style={{
        ...style,
        ...styleProp,
      }}
      type="submit"
    >
      {children}
    </Button>
  );
};
