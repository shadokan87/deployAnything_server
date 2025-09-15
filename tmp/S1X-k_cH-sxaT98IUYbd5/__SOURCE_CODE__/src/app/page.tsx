"use client";
// Components
import Flex from "@/components/Flex";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { initialMessages} from "../misc";

//remix icon
import {RiLinkedinLine, RiPhoneLine, RiAtLine } from "@remixicon/react";

// ai sk
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
// Tooltip
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Others
import { If, Then, Else, When } from "react-if";
import Image from "next/image";
import { Fragment, useState, useEffect, useRef, ReactNode } from "react";
import { CornerDownLeft } from "lucide-react";
import { marked } from 'marked';

interface messageAreaProps {
  messages: UIMessage[]
}

const LoadingDots = () => {
  const dotStyle = "w-2 h-2 rounded-full bg-foreground";
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <Flex gap={2} className="h-8 items-center">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${dotStyle} transition-all duration-300 ${activeDot === index ? "opacity-100" : "opacity-30"
            }`}
        />
      ))}
    </Flex>
  );
};

export default function Home() {
  const presetQuestions = ["tell me about some interesting project you have built", "what is your github", "do you have social media", "where did you study"];
  const colors = [
    "#FFB3BA", // pastel pink
    "#BAFFC9", // pastel green
    "#BAE1FF", // pastel blue
    "#FFD1DC", // light pink
    "#E0FFFF", // light cyan
    "#FFDAB9", // peach
    "#D8BFD8", // thistle
    "#DCD0FF", // pastel purple
    "#F0FFF0", // honeydew
  ];

  const { messages, input, handleInputChange, handleSubmit, status, error, stop, setInput } = useChat({
    initialMessages: [],
  });
  const [talkToHuman, setTalkToHuman] = useState<boolean>(false);

  const [inputFocus, setInputFocus] = useState<boolean>(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageContainerRef.current && (status === "streaming" || messages.length > 0)) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, status]);

  useEffect(() => {
    const handleContainerClick = () => {
      const inputElement = inputContainerRef.current?.querySelector('input');
      inputElement?.focus();
    };

    const container = inputContainerRef.current;
    container?.addEventListener('click', handleContainerClick);

    return () => {
      container?.removeEventListener('click', handleContainerClick);
    };
  }, []);

  const RenderMessages = () => <Flex col gap={2}>
    {messages.map((message, index) => {
      const isAssistant = message.role == "assistant";
      return <Flex col key={index}>
        {/* <Flex gap={2} className="items-center"> */}
          <p className="opacity-50">{isAssistant ? "Ai" : "You"}</p>
        {/* </Flex> */}
        <div
          className="prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: marked(message.content) }}
        />
          <When condition={index == messages.length - 1 && isAssistant && (status == "streaming" || status == "submitted")}>
            <LoadingDots />
          </When>
      </Flex>
    })}
  </Flex>

  const talkToHumanNode = () => <Flex col className="w-full md:w-2/3 mx-auto p-8 gap-6">
    <h1 className="font-inter font-bold text-4xl">Contact me</h1>
    <Flex col gap={4} className="text-lg">
      <Flex gap={2} className="items-center">
        <RiAtLine />
        <a href="mailto:eclipse.toure@outlook.fr" className="hover:underline">eclipse.toure@outlook.fr</a>
      </Flex>
      <Flex gap={2} className="items-center">
        <RiLinkedinLine />
        <a href="https://linkedin.com/in/eclipse-toure" target="_blank" rel="noopener noreferrer" className="hover:underline">linkedin.com/in/eclipse-toure</a>
      </Flex>
      <Flex gap={2} className="items-center">
        <RiPhoneLine />
        <a href="tel:+33625293138" className="hover:underline">+33 6 25 29 31 38</a>
      </Flex>
    </Flex>
    <p className="text-lg mt-4">Based in Paris, France</p>
  </Flex>

  const RenderPresetQuestions = () => <Flex className="max-w-md flex-wrap transition" gap={2}>{presetQuestions.map((question, index) => {
    return (
      <Button onClick={() => {
        setInput(question);
        setTimeout(() => {
          if (status != "streaming")
            formRef.current?.requestSubmit();
        }, 0);
      }} key={index} variant={"outline"} className="!bg-transparent !rounded-full !shadow-none hover:!bg-accent">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
        {question}
      </Button>
    );
  })}</Flex>

  const chat = () => {
    return <Flex col className="w-full md:w-2/3 mx-auto max-h-[calc(100vh-4rem)]">
      <Flex col gap={4} className="flex-1 overflow-hidden flex-wrap">
        <div className="flex flex-1 overflow-y-auto flex-col gap-4" ref={messageContainerRef}>
          <div>
            {introduction}
          </div>
          <RenderMessages />
          <When condition={status == "ready" || status == "error"}>
            <Accordion type="single" defaultValue="item-1" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Preset questions</AccordionTrigger>
                <AccordionContent>
                  <RenderPresetQuestions />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </When>
        </div>
      </Flex>
      <form ref={formRef} onSubmit={handleSubmit} className="w-full flex mb-4 pt-2">
        <Flex
          ref={inputContainerRef}
          className={`w-full min-h-10 bg-accent rounded-full transition-all box-border pl-4 ${inputFocus
            ? 'bg-background ring-2 ring-[#90E0EF]'
            : 'hover:bg-background hover:ring-2 hover:ring-[#90E0EF]'
            }`}
        >
          <input
            placeholder="type anything, or click on a preset above"
            name="prompt"
            value={input}
            onChange={handleInputChange}
            onFocus={() => setInputFocus(true)}
            onBlur={() => setInputFocus(false)}
            className={`w-full min-h-10 focus:outline-none bg-transparent ${inputFocus ? '' : 'cursor-pointer'}`}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="submit" className="p-2" disabled={input.length == 0}>
                  <CornerDownLeft />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{input.length == 0 ? 'Type something first' : 'Send message'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Flex>
      </form>
    </Flex>
  }

  const introduction = <Flex col>
    <h1 className="font-inter font-bold text-4xl mb-4">Hello 👋, I am Eclipse.</h1>
    <p className="whitespace-pre-wrap max-w-[40ch]">{`I am a software engineer based in Paris, my current focus is to create AI apps that looks like magic to the user. Ask me any question below (it's powered by AI ✨)`}</p>
  </Flex>
  return (
    <main className="w-full flex-col">
      <Flex justify="between" className="h-12 position-sticky">
        <div className="w-full"></div>
        <Flex gap={2}>
          <ModeToggle />
          <Button variant="ghost" onClick={() => setTalkToHuman(prev => !prev)}>{talkToHuman ? "Return to AI chat" : "Talk to a human"}</Button>
        </Flex>
      </Flex>
      <If condition={talkToHuman == false}>
        <Then>
          {chat}
        </Then>
        <Else>
          {talkToHumanNode}
        </Else>
      </If>
    </main>
  );
}
