// 页面数据访问层。组件只经由这里取数,不直接读文件,也不再 import 静态 mock。
// 优先读 data/snapshot.json(真实管线的产出);文件缺失或损坏时回退到出厂种子。
// 用 React cache 包裹,确保同一次渲染内只读盘一次。

import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { seedSnapshot } from "./seed";
import type {
  ArchiveItem,
  FeaturedStory,
  NewsItem,
  ReportCard,
  Snapshot,
  SourceStat,
  TopTopic
} from "./types";

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "snapshot.json");

export const getSnapshot = cache(async (): Promise<Snapshot> => {
  try {
    const raw = await readFile(SNAPSHOT_PATH, "utf8");
    // 部分快照:管线尚未产出的字段(如未接 AI 的 featured / daily)回退种子。
    const fileSnapshot = JSON.parse(raw) as Partial<Snapshot>;
    return { ...seedSnapshot, ...fileSnapshot };
  } catch {
    // 首次运行 / 尚未跑过更新 / 文件损坏:回退种子,保证页面永远可渲染。
    return seedSnapshot;
  }
});

export async function getFeatured(): Promise<FeaturedStory[]> {
  return (await getSnapshot()).featured;
}

export async function getNews(): Promise<NewsItem[]> {
  return (await getSnapshot()).news;
}

export async function getTopTopics(): Promise<TopTopic[]> {
  return (await getSnapshot()).topics;
}

export async function getSourceStats(): Promise<SourceStat[]> {
  return (await getSnapshot()).sources;
}

export async function getReportCards(): Promise<ReportCard[]> {
  return (await getSnapshot()).daily.reportCards;
}

export async function getArchive(): Promise<ArchiveItem[]> {
  return (await getSnapshot()).daily.archive;
}
