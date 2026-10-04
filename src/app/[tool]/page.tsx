import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { pdfTools } from "@/data/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return pdfTools.map((tool) => ({ tool: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = pdfTools.find((item) => item.slug === slug);
  if (!tool) return {};

  return {
    title: tool.name,
    description: tool.description,
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool: slug } = await params;
  const tool = pdfTools.find((item) => item.slug === slug);
  if (!tool) notFound();

  return <HomePage initialToolSlug={tool.slug} />;
}
