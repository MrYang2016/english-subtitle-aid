import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { HumanMessage } from "@langchain/core/messages";
import type { Messages } from './aiChat.d';

const model = 'qwen-max';
const qwenMax = new ChatAlibabaTongyi({
  model, // Available models: qwen-turbo, qwen-plus, qwen-max
  temperature: 0,
  alibabaApiKey: process.env.TONGYI_API_KEY, // In Node.js defaults to process.env.ALIBABA_API_KEY
});

export async function tongyiCreateCompletion(options: {
  messages: Messages[], temperature?: number
}) {
  const { messages } = options;
  try {
    const result = await qwenMax.invoke(messages.map(v => new HumanMessage(v.content)));
    const content = String(result?.content || '');
    console.log({ content });
    return content;
  } catch (error) {
    console.error({ type: 'createCompletion', error, ...options });
    return '';
  }
}
