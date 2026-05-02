import readline from "node:readline/promises";

import { fetchTrendingTopics } from "@/src/lib/storyflow/discovery";

export async function pickTopic(
  geo: "US",
  maxHeadlines: number,
  preSelectedIndex?: number
): Promise<{
  topic: string;
  context: string;
}> {
  const topics = await fetchTrendingTopics(geo);
  if (topics.length === 0) {
    throw new Error("Google Trends returned no topics. Try again later, or verify network access to Trends RSS.");
  }

  console.log("\nTrending topics:");
  topics.forEach((topic, index) => {
    const traffic = topic.traffic ? ` (${topic.traffic})` : "";
    console.log(`[${index + 1}] ${topic.query}${traffic}`);
  });

  if (preSelectedIndex !== undefined) {
    const index = preSelectedIndex - 1;
    if (!Number.isInteger(index) || index < 0 || index >= topics.length) {
      throw new Error(`--topic ${preSelectedIndex} is out of range (1–${topics.length}).`);
    }
    const selectedTopic = topics[index];
    console.log(`\nAuto-selected topic ${preSelectedIndex}: ${selectedTopic.query}`);
    const context = selectedTopic.newsItems
      .slice(0, maxHeadlines)
      .map((item) => item.title.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .join("\n");
    return { topic: selectedTopic.query, context: context || `Topic: ${selectedTopic.query}` };
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const answer = await rl.question("\nPick a topic by number: ");
      const selectedIndex = Number.parseInt(answer.trim(), 10) - 1;
      if (Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < topics.length) {
        const selectedTopic = topics[selectedIndex];
        const context = selectedTopic.newsItems
          .slice(0, maxHeadlines)
          .map((item) => item.title.trim().replace(/\s+/g, " "))
          .filter(Boolean)
          .join("\n");

        return {
          topic: selectedTopic.query,
          context: context || `Topic: ${selectedTopic.query}`,
        };
      }

      console.warn(`Invalid selection. Enter a number from 1 to ${topics.length}.`);
    }
  } finally {
    rl.close();
  }

  throw new Error("Topic selection failed after 3 invalid attempts.");
}
