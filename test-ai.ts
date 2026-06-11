import { convertToModelMessages } from "ai";

async function test() {
  try {
    const messages = [{ 
      id: "123", 
      role: "user", 
      parts: [{ type: "text", text: "hello" }] 
    }];
    
    const coreMessages = await convertToModelMessages(messages as any);
    console.log("Success! Core Messages:", JSON.stringify(coreMessages, null, 2));
  } catch (err: any) {
    console.error("Caught error:", err.message);
  }
}

test();
