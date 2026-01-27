"use client";

import React from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/use-language";
import {
  CardCurtain,
  CardCurtainReveal,
  CardCurtainRevealBody,
  CardCurtainRevealDescription,
  CardCurtainRevealFooter,
  CardCurtainRevealTitle,
} from "@/components/systaliko-ui/cards/card-curtain-reveal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardImage,
  CardTitle,
} from "@/components/ui/lift-card";
import { Button as LiftButton } from "@/components/ui/lift-button";


export type BentoItem = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  size?: "small" | "medium" | "large" | "wide" | "tall";
  color?: string; // background for solid variants
  accentColor?: string; // text color override
  variant?: "default" | "highlight" | "glass" | "solid";
  tag?: string;
  priority?: number;
};

export type BentoGridProps = {
  items: BentoItem[];
  className?: string;
  animate?: boolean;
  gap?: number;
};

export function BentoGridTemplateTwo({
  items,
  className,
  animate = true,
  gap = 4,
}: BentoGridProps) {
  const cols = 4;
  const leftover = items.length % cols;

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(140px,auto)]",
        className
      )}
      style={{ gap: `${gap * 0.25}rem` }}
    >
      {items.map((item, i) => {
        const isLastSingle = leftover === 1 && i === items.length - 1;
        return (
          <m.div
            key={item.id}
            initial={animate ? { opacity: 0, y: 20 } : undefined}
            animate={animate ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: 0.4,
              delay: animate ? 0.1 + i * 0.1 : 0,
              ease: [0.21, 0.58, 0.36, 1],
            }}
            className={cn(
              "col-span-1",
              item.size === "large" && "md:col-span-2 md:row-span-2",
              item.size === "wide" && "md:col-span-2",
              item.size === "tall" &&
              item.variant !== "glass" &&
              "md:row-span-2",
              item.priority === 1 && "md:col-span-2 md:row-span-2",
              isLastSingle && "md:col-span-4"
            )}
          >
            <BentoGridItem item={item} />
          </m.div>
        );
      })}
    </div>
  );
}

function BentoGridItem({ item }: { item: BentoItem }) {
  const { t } = useLanguage();
  const {
    title,
    description,
    image,
    link,
    color,
    accentColor,
    variant = "default",
    tag,
  } = item;

  const hasImage = Boolean(image);

  // Special case for 'large' items using CardCurtainReveal
  if (item.size === "large") {
    return (
      <CardCurtainReveal className="h-full w-full border bg-neutral-900 text-neutral-50 shadow-md dark:bg-neutral-50 dark:text-neutral-900">
        <CardCurtainRevealBody className="p-4 sm:p-6">
          <CardCurtainRevealTitle className="text-xl md:text-3xl font-medium tracking-tight leading-tight">
            {title}
          </CardCurtainRevealTitle>
          <CardCurtainRevealDescription className="my-2 md:my-4 text-xs md:text-base text-neutral-300 dark:text-neutral-600 line-clamp-2 md:line-clamp-none">
            <p>{description}</p>
          </CardCurtainRevealDescription>
          {link && (
            <Link href={link} aria-label={`${t('landing.blog.learnMore')}: ${title}`}>
              <span className="sr-only">
                {t('landing.blog.learnMore')}: {title}
              </span>
              <Button
                variant="secondary"
                size="icon"
                className="size-8 md:size-10 rounded-full"
                asChild
              >
                <span>
                  <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5" />
                </span>
              </Button>
            </Link>
          )}

          <CardCurtain className="bg-background" />
        </CardCurtainRevealBody>

        <CardCurtainRevealFooter className="mt-auto h-[140px] md:h-[200px]">
          {image && (
            <img
              alt={title}
              width={600}
              height={400}
              loading="lazy"
              className="size-full object-cover"
              src={image}
            />
          )}
        </CardCurtainRevealFooter>
      </CardCurtainReveal>
    );
  }

  // Use new Card for everything else
  return (
    <Card
      className="max-w-full rounded-[16px] sm:max-w-[360px] sm:rounded-[24px] h-full"
      variant="lift"
      style={variant === "solid" && color ? { backgroundColor: color } : undefined}
    >
      {image && (
        <CardImage
          alt={title}
          width={400}
          height={250}
          className="w-auto rounded-[8px] sm:rounded-[12px]"
          src={image}
          loading="lazy"
        />
      )}

      <CardContent className="p-4 sm:p-6">
        {tag && (
          <span className="inline-block rounded-md px-1.5 py-0.5 text-[10px] md:text-xs font-semibold mb-1.5 md:mb-2 bg-muted text-muted-foreground w-fit">
            {tag}
          </span>
        )}
        <CardTitle className="m-0 text-base md:text-xl font-semibold leading-snug">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="mt-1 text-xs md:text-base line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardContent>

      <CardFooter className="p-4 sm:p-6 pt-0">
        {link && (
          <Link href={link} aria-label={`${t('landing.blog.learnMore')}: ${title}`}>
            <span className="sr-only">
              {t('landing.blog.learnMore')}: {title}
            </span>
            <LiftButton showArrow size="xs" variant="outline" render={<span />} className="text-[10px] md:text-sm px-2 py-1 h-7">
              {t('landing.blog.learnMore')}
            </LiftButton>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
