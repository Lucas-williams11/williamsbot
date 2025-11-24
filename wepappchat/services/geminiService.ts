
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { VideoIdea, ChannelAnalysis, ChatMessage, YouTubeChannel, YouTubeVideoDetails, OneMillionAnalysis, VideoProposal, StoryboardScene } from '../types';
import { Language } from "../lib/translations";

if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const videoIdeaSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "A catchy, SEO-optimized video title.",
      },
      description: {
        type: Type.STRING,
        description: "A brief, engaging description for the video concept.",
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "An array of 3-5 relevant keywords or tags for the video.",
      },
    },
    required: ["title", "description", "tags"],
  },
};

const channelAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        strengths: {
            type: Type.ARRAY,
            items: {type: Type.STRING},
            description: "A list of perceived strengths of the channel based on the provided data."
        },
        weaknesses: {
            type: Type.ARRAY,
            items: {type: Type.STRING},
            description: "A list of potential weaknesses or areas for improvement based on the provided data."
        },
        opportunities: {
            type: Type.ARRAY,
            items: {type: Type.STRING},
            description: "A list of key growth opportunities for the channel based on the provided data."
        },
        videoIdeas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["title", "description"]
            },
            description: "Three concrete video ideas to capitalize on the opportunities, relevant to the channel's recent content."
        }
    },
    required: ["strengths", "weaknesses", "opportunities", "videoIdeas"]
};

const videoProposalSchema = {
    type: Type.OBJECT,
    properties: {
        titles: {
            type: Type.ARRAY,
            description: "3 catchy, SEO-optimized alternative video titles.",
            items: { type: Type.STRING }
        },
        description: {
            type: Type.STRING,
            description: "A complete, SEO-optimized YouTube video description using insights from the benchmark video."
        },
        tags: {
            type: Type.ARRAY,
            description: "An array of 10-15 relevant keywords and tags for the video.",
            items: { type: Type.STRING }
        },
        script: {
            type: Type.OBJECT,
            properties: {
                hook: { type: Type.STRING, description: "A powerful, 15-second opening hook script." },
                introduction: { type: Type.STRING, description: "A brief introduction to the video's topic and value." },
                mainPoints: {
                    type: Type.ARRAY,
                    description: "3-5 bullet points covering the main sections of the video content.",
                    items: { type: Type.STRING }
                },
                callToAction: { type: Type.STRING, description: "A clear call to action (e.g., subscribe, comment, check link)." },
                outro: { type: Type.STRING, description: "A concluding summary and outro for the video." }
            },
            required: ["hook", "introduction", "mainPoints", "callToAction", "outro"]
        },
        thumbnailConcepts: {
            type: Type.ARRAY,
            description: "2 distinct thumbnail concepts, described in detail including visual elements, text overlays, and emotional tone to maximize click-through rate.",
            items: { type: Type.STRING }
        }
    },
    required: ["titles", "description", "tags", "script", "thumbnailConcepts"]
};

const comparativeAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        userVideo: {
            type: Type.OBJECT,
            properties: {
                strength: { type: Type.STRING, description: "The single biggest strength of the user's video." },
                weakness: { type: Type.STRING, description: "The single biggest weakness of the user's video." }
            },
            required: ["strength", "weakness"]
        },
        benchmarkVideo: {
            type: Type.OBJECT,
            properties: {
                strength: { type: Type.STRING, description: "The single biggest strength of the benchmark video." },
                tacticToAdopt: { type: Type.STRING, description: "The key strategy from the benchmark video that the user should adopt." }
            },
            required: ["strength", "tacticToAdopt"]
        },
        improvementAreas: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Specific advice to improve the user's video title." },
                thumbnail: { type: Type.STRING, description: "Specific advice to improve the user's thumbnail." },
                content: { type: Type.STRING, description: "Specific advice to improve the user's video content/script." }
            },
            required: ["title", "thumbnail", "content"]
        }
    },
    required: ["userVideo", "benchmarkVideo", "improvementAreas"]
};


const createOneMillionAnalysisSchema = (isComparative: boolean) => ({
    type: Type.OBJECT,
    properties: {
        benchmarkVideoAnalysis: {
            type: Type.OBJECT,
            properties: {
                titleHook: { type: Type.STRING, description: "Analysis of what makes the benchmark video's title effective." },
                contentStrategy: { type: Type.STRING, description: "Analysis of the video's content structure and pacing." },
                targetAudience: { type: Type.STRING, description: "A profile of the likely target audience for this video." },
                monetizationPotential: { type: Type.STRING, description: "Analysis of how this video format could be monetized." },
            },
            required: ["titleHook", "contentStrategy", "targetAudience", "monetizationPotential"]
        },
        consultingResult: isComparative ? comparativeAnalysisSchema : videoProposalSchema,
    },
    required: ["benchmarkVideoAnalysis", "consultingResult"]
});

const storyboardPromptsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            scene: {
                type: Type.STRING,
                description: "A short title for the key visual scene (e.g., 'Opening Hook', 'Core Concept Demo')."
            },
            prompt: {
                type: Type.STRING,
                description: "A detailed, descriptive prompt for an AI image generator to create this scene's visual. It should describe the setting, characters, mood, and camera angle."
            }
        },
        required: ["scene", "prompt"]
    }
};

// Common prompts for features other than One Million Consultant
const commonPrompts = {
    en: {
        keywordSystem: "You are an expert YouTube growth strategist. A user wants to create content about \"${keyword}\". Generate 5 creative, high-engagement video ideas. For each idea, provide a catchy, SEO-optimized title, a brief description, and 3-5 relevant keywords/tags. Response must be in English.",
        channelSystem: "You are a professional YouTube channel analyst. I will provide you with data fetched directly from the YouTube API.\nAnalyze the following channel:\n\n**Channel Name:** ${title}\n**Subscribers:** ${subs}\n**Total Views:** ${views}\n**Total Videos:** ${count}\n\n**Recent Video Titles:**\n${videoTitles}\n\nBased *only* on this provided data, perform an expert analysis. Provide:\n1.  **Perceived Strengths:** At least 3 strengths suggested by the data (e.g., \"Strong subscriber base indicates loyal audience\", \"Consistent uploads based on recent videos\").\n2.  **Potential Weaknesses:** At least 3 potential weaknesses (e.g., \"Video titles may lack a clear SEO focus\", \"View count to subscriber ratio could be improved\").\n3.  **Key Opportunities for Growth:** At least 3 actionable opportunities (e.g., \"Create a series based on the most popular recent video topics\", \"Collaborate with channels of similar size\").\n4.  **Three Concrete Video Ideas:** Provide titles and descriptions for three video ideas that directly capitalize on the opportunities you've identified and are relevant to the recent video titles. Response must be in English.",
        chatSystem: "You are 'Creator Boost AI', an expert YouTube consultant. Your goal is to provide actionable, data-driven advice to help content creators grow their channels and monetize their content. Be encouraging, specific, and professional. Use markdown for formatting like lists, bolding, and italics to make your responses easy to read. Response must be in English."
    },
    es: {
        keywordSystem: "Eres un experto estratega de crecimiento en YouTube. Un usuario quiere crear contenido sobre \"${keyword}\". Genera 5 ideas de video creativas y de alto compromiso. Para cada idea, proporciona un título pegadizo y optimizado para SEO, una breve descripción y 3-5 palabras clave/etiquetas relevantes. La respuesta debe estar en Español.",
        channelSystem: "Eres un analista profesional de canales de YouTube. Te proporcionaré datos obtenidos directamente de la API de YouTube.\nAnaliza el siguiente canal:\n\n**Nombre del Canal:** ${title}\n**Suscriptores:** ${subs}\n**Vistas Totales:** ${views}\n**Videos Totales:** ${count}\n\n**Títulos de Videos Recientes:**\n${videoTitles}\n\nBasado *solo* en estos datos proporcionados, realiza un análisis experto. Proporciona:\n1.  **Fortalezas Percibidas:** Al menos 3 fortalezas sugeridas por los datos.\n2.  **Debilidades Potenciales:** Al menos 3 debilidades potenciales.\n3.  **Oportunidades Clave de Crecimiento:** Al menos 3 oportunidades accionables.\n4.  **Tres Ideas Concretas de Video:** Proporciona títulos y descripciones para tres ideas de video que capitalicen directamente las oportunidades que has identificado y sean relevantes para los títulos de videos recientes. La respuesta debe estar en Español.",
        chatSystem: "Eres 'Creator Boost AI', un consultor experto de YouTube. Tu objetivo es proporcionar consejos accionables y basados en datos para ayudar a los creadores de contenido a hacer crecer sus canales y monetizar su contenido. Sé alentador, específico y profesional. Usa markdown para formatear como listas, negritas y cursivas para facilitar la lectura. La respuesta debe estar en Español."
    },
    pt: {
        keywordSystem: "Você é um estrategista especialista em crescimento no YouTube. Um usuário deseja criar conteúdo sobre \"${keyword}\". Gere 5 ideias de vídeo criativas e de alto engajamento. Para cada ideia, forneça um título cativante e otimizado para SEO, uma breve descrição e 3-5 palavras-chave/tags relevantes. A resposta deve estar em Português.",
        channelSystem: "Você é um analista profissional de canais do YouTube. Fornecei dados obtidos diretamente da API do YouTube.\nAnalise o seguinte canal:\n\n**Nome do Canal:** ${title}\n**Inscritos:** ${subs}\n**Visualizações Totais:** ${views}\n**Total de Vídeos:** ${count}\n\n**Títulos de Vídeos Recientes:**\n${videoTitles}\n\nCom base *apenas* nesses dados fornecidos, realize uma análise especializada. Forneça:\n1.  **Pontos Fortes Percebidos:** Pelo menos 3 pontos fortes sugeridos pelos dados.\n2.  **Pontos Fracos Potenciais:** Pelo menos 3 pontos fracos potenciais.\n3.  **Principais Oportunidades de Crescimento:** Pelo menos 3 oportunidades acionáveis.\n4.  **Três Ideias Concretas de Vídeo:** Forneça títulos e descrições para três ideias de vídeo que capitalizem diretamente as oportunidades que você identificou e sejam relevantes para os títulos de vídeos recentes. A resposta deve estar em Português.",
        chatSystem: "Você é o 'Creator Boost AI', um consultor especialista em YouTube. Seu objetivo é fornecer conselhos acionáveis e baseados em dados para ajudar os criadores de conteúdo a expandir seus canais e monetizar seu conteúdo. Seja encorajador, específico e profissional. Use markdown para formatação como listas, negrito e itálico para facilitar a leitura. A resposta deve estar em Português."
    }
};


const oneMillionPrompts = {
    en: {
        base: "You are a world-class YouTube growth consultant with 20 years of experience at McKinsey, specializing in viral video strategy. Your analysis is sharp, actionable, and data-driven. Your response must be in English.",
        request: "I need a deep analysis of the following video(s).",
        benchmarkLabel: "Benchmark Video",
        userLabel: "User's Video",
        detailsLabel: "Video Details",
        videoDataLabels: {
            title: "Title",
            views: "Views",
            likes: "Likes",
            description: "Description",
            tags: "Tags",
        },
        newTask: {
            title: "**Task:**",
            step1: "1.  **Analyze Benchmark Video:** Deeply analyze the benchmark video's title hook, content strategy, target audience, and monetization potential.",
            step2: "2.  **Create a New Video Blueprint:** Based on the analysis, create a complete blueprint for a NEW video that could achieve similar or greater success. This blueprint must include:\n    - 3 alternative, catchy titles.\n    - A full, SEO-optimized description.\n    - A list of 10-15 relevant tags.\n    - A structured script outline (Hook, Intro, Main Points, CTA, Outro).\n    - 2 detailed thumbnail concepts.",
        },
        comparativeTask: {
            title: "**Task:**",
            step1: "1.  **Analyze Benchmark Video:** Briefly analyze the benchmark video's title hook, content strategy, target audience, and monetization potential.",
            step2: "2.  **Comparative Analysis:** Compare the user's video to the benchmark. Identify the single biggest strength and weakness for each.",
            step3: "3.  **Provide Actionable Advice:** Give concrete improvement suggestions for the user's video title, thumbnail, and content based on the benchmark's success. Your goal is to provide a clear path for the user to improve their video's performance.",
        },
        fullScript: {
            prompt: "You are a professional YouTube scriptwriter. Based on the following video title and script outline, write a complete, engaging, and detailed script for an 8-10 minute video. Include spoken lines, camera shot suggestions (e.g., 'close-up', 'wide shot'), and on-screen text/graphics callouts. The script must be in English."
        },
        storyboard: {
            prompt: "You are a creative director. Based on the following video title and script outline, break the video down into 4 key visual scenes for a compelling storyboard. For each scene, provide a short title and a detailed, descriptive prompt for an AI image generator. The prompt should describe the setting, characters, mood, and camera angle. Your response must be in English."
        }
    },
    es: {
        base: "Eres un consultor de crecimiento de YouTube de clase mundial con 20 años de experiencia en McKinsey, especializado en estrategia de videos virales. Tu análisis es agudo, accionable y basado en datos. Tu respuesta debe estar en Español.",
        request: "Necesito un análisis profundo de los siguientes video(s).",
        benchmarkLabel: "Video de Referencia",
        userLabel: "Video del Usuario",
        detailsLabel: "Detalles del Video",
        videoDataLabels: {
            title: "Título",
            views: "Vistas",
            likes: "Me gusta",
            description: "Descripción",
            tags: "Etiquetas",
        },
        newTask: {
            title: "**Tarea:**",
            step1: "1.  **Analizar Video de Referencia:** Analiza profundamente el gancho del título, estrategia de contenido, audiencia objetivo y potencial de monetización del video de referencia.",
            step2: "2.  **Crear un Nuevo Plano de Video:** Basado en el análisis, crea un plano completo para un NUEVO video que podría lograr un éxito similar o mayor. Este plano debe incluir:\n    - 3 títulos alternativos y pegadizos.\n    - Una descripción completa optimizada para SEO.\n    - Una lista de 10-15 etiquetas relevantes.\n    - Un esquema de guion estructurado (Gancho, Intro, Puntos Principales, CTA, Cierre).\n    - 2 conceptos detallados de miniaturas.",
        },
        comparativeTask: {
            title: "**Tarea:**",
            step1: "1.  **Analizar Video de Referencia:** Analiza brevemente el gancho del título, estrategia de contenido, audiencia objetivo y potencial de monetización del video de referencia.",
            step2: "2.  **Análisis Comparativo:** Compara el video del usuario con el de referencia. Identifica la mayor fortaleza y debilidad de cada uno.",
            step3: "3.  **Proporcionar Consejos Accionables:** Da sugerencias concretas de mejora para el título, miniatura y contenido del video del usuario basadas en el éxito de la referencia. Tu objetivo es proporcionar un camino claro para que el usuario mejore el rendimiento de su video.",
        },
        fullScript: {
            prompt: "Eres un guionista profesional de YouTube. Basado en el siguiente título de video y esquema de guion, escribe un guion detallado, atractivo y completo para un video de 8-10 minutos. Incluye diálogos hablados, sugerencias de tomas de cámara (ej., 'primer plano', 'plano general') y llamadas de texto/gráficos en pantalla. El guion debe estar en Español."
        },
        storyboard: {
            prompt: "Eres un director creativo. Basado en el siguiente título de video y esquema de guion, divide el video en 4 escenas visuales clave para un guion gráfico convincente. Para cada escena, proporciona un título corto y un prompt detallado y descriptivo para un generador de imágenes AI. El prompt debe describir el entorno, personajes, estado de ánimo y ángulo de cámara. Tu respuesta debe estar en Español."
        }
    },
    pt: {
        base: "Você é um consultor de crescimento do YouTube de classe mundial com 20 anos de experiência na McKinsey, especializado em estratégia de vídeos virais. Sua análise é precisa, acionável e baseada em dados. Sua resposta deve estar em Português.",
        request: "Preciso de uma análise profunda do(s) seguinte(s) vídeo(s).",
        benchmarkLabel: "Vídeo de Referência",
        userLabel: "Vídeo do Usuário",
        detailsLabel: "Detalhes do Vídeo",
        videoDataLabels: {
            title: "Título",
            views: "Visualizações",
            likes: "Curtidas",
            description: "Descrição",
            tags: "Tags",
        },
        newTask: {
            title: "**Tarefa:**",
            step1: "1.  **Analisar Vídeo de Referência:** Analise profundamente o gancho do título, estratégia de conteúdo, público-alvo e potencial de monetização do vídeo de referência.",
            step2: "2.  **Criar um Novo Plano de Vídeo:** Com base na análise, crie um plano completo para um NOVO vídeo que poderia alcançar sucesso semelhante ou maior. Este plano deve incluir:\n    - 3 títulos alternativos e cativantes.\n    - Uma descrição completa otimizada para SEO.\n    - Uma lista de 10-15 tags relevantes.\n    - Um esboço de roteiro estruturado (Gancho, Intro, Pontos Principais, CTA, Encerramento).\n    - 2 conceitos detalhados de miniaturas.",
        },
        comparativeTask: {
            title: "**Tarefa:**",
            step1: "1.  **Analisar Vídeo de Referência:** Analise brevemente o gancho do título, estratégia de conteúdo, público-alvo e potencial de monetização do vídeo de referência.",
            step2: "2.  **Análise Comparativa:** Compare o vídeo do usuário com a referência. Identifique o maior ponto forte e fraco de cada um.",
            step3: "3.  **Fornecer Conselhos Acionáveis:** Dê sugestões concretas de melhoria para o título, miniatura e conteúdo do vídeo do usuário com base no sucesso da referência. Seu objetivo é fornecer um caminho claro para que o usuário melhore o desempenho do seu vídeo.",
        },
        fullScript: {
            prompt: "Você é um roteirista profissional de YouTube. Com base no seguinte título de vídeo e esboço de roteiro, escreva um roteiro detalhado, envolvente e completo para um vídeo de 8-10 minutos. Inclua falas, sugestões de tomadas de câmera (ex., 'close-up', 'plano aberto') e chamadas de texto/gráficos na tela. O roteiro deve estar em Português."
        },
        storyboard: {
            prompt: "Você é um diretor criativo. Com base no seguinte título de vídeo e esboço de roteiro, divida o vídeo em 4 cenas visuais principais para um storyboard convincente. Para cada cena, forneça um título curto e um prompt detalhado e descritivo para um gerador de imagens AI. O prompt deve descrever o cenário, personagens, humor e ângulo da câmera. Sua resposta deve estar em Português."
        }
    }
};


const formatVideoDataForPrompt = (video: YouTubeVideoDetails, role: string, labels: { title: string; views: string; likes: string; description: string; tags: string; }, detailsLabel: string) => `
**${role} ${detailsLabel}:**
- **${labels.title}:** ${video.title}
- **${labels.views}:** ${parseInt(video.stats.viewCount, 10).toLocaleString()}
- **${labels.likes}:** ${parseInt(video.stats.likeCount, 10).toLocaleString()}
- **${labels.description}:** ${video.description.substring(0, 300)}...
- **${labels.tags}:** ${video.tags.slice(0, 10).join(', ')}
`;

export const generateOneMillionConsulting = async (benchmarkVideo: YouTubeVideoDetails, language: Language, userVideo?: YouTubeVideoDetails): Promise<OneMillionAnalysis> => {
    const isComparative = !!userVideo;
    // @ts-ignore
    const selectedPrompts = oneMillionPrompts[language] || oneMillionPrompts.en;

    let prompt = `${selectedPrompts.base}\n\n${selectedPrompts.request}\n\n${formatVideoDataForPrompt(benchmarkVideo, selectedPrompts.benchmarkLabel, selectedPrompts.videoDataLabels, selectedPrompts.detailsLabel)}\n`;

    if (isComparative && userVideo) {
        prompt += formatVideoDataForPrompt(userVideo, selectedPrompts.userLabel, selectedPrompts.videoDataLabels, selectedPrompts.detailsLabel);
        prompt += `\n${selectedPrompts.comparativeTask.title}\n${selectedPrompts.comparativeTask.step1}\n${selectedPrompts.comparativeTask.step2}\n${selectedPrompts.comparativeTask.step3}\n`;
    } else {
        prompt += `\n${selectedPrompts.newTask.title}\n${selectedPrompts.newTask.step1}\n${selectedPrompts.newTask.step2}\n`;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: createOneMillionAnalysisSchema(isComparative),
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateFullScript = async (scriptOutline: VideoProposal['script'], videoTitle: string, language: Language): Promise<string> => {
    // @ts-ignore
    const selectedPrompts = oneMillionPrompts[language] || oneMillionPrompts.en;
    const prompt = `
${selectedPrompts.fullScript.prompt}

**Video Title:** ${videoTitle}

**Script Outline:**
- **Hook:** ${scriptOutline.hook}
- **Introduction:** ${scriptOutline.introduction}
- **Main Points:** 
${scriptOutline.mainPoints.map(p => `  - ${p}`).join('\n')}
- **Call to Action:** ${scriptOutline.callToAction}
- **Outro:** ${scriptOutline.outro}
`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    return response.text;
}

export const generateStoryboardPrompts = async (videoTitle: string, scriptOutline: VideoProposal['script'], language: Language): Promise<StoryboardScene[]> => {
    // @ts-ignore
    const selectedPrompts = oneMillionPrompts[language] || oneMillionPrompts.en;
    const prompt = `
${selectedPrompts.storyboard.prompt}

**Video Title:** ${videoTitle}

**Script Outline:**
- **Hook:** ${scriptOutline.hook}
- **Introduction:** ${scriptOutline.introduction}
- **Main Points:** 
${scriptOutline.mainPoints.map(p => `  - ${p}`).join('\n')}
- **Call to Action:** ${scriptOutline.callToAction}
- **Outro:** ${scriptOutline.outro}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: storyboardPromptsSchema,
        }
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateThumbnailImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a cinematic, high-impact YouTube thumbnail based on this concept: "${prompt}". Ensure it is visually striking, easy to read, and evokes curiosity. Aspect ratio 16:9.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed to produce an image.");
    }

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return base64ImageBytes;
};


export const generateKeywordIdeas = async (keyword: string, language: Language): Promise<VideoIdea[]> => {
  // @ts-ignore
  const promptTemplate = commonPrompts[language]?.keywordSystem || commonPrompts.en.keywordSystem;
  const prompt = promptTemplate.replace('${keyword}', keyword);
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: videoIdeaSchema,
    },
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

export const generateChannelAnalysis = async (channelData: YouTubeChannel, language: Language): Promise<ChannelAnalysis> => {
    const videoTitles = channelData.videos.map(v => `- "${v.title}"`).join('\n');
    
    // @ts-ignore
    const promptTemplate = commonPrompts[language]?.channelSystem || commonPrompts.en.channelSystem;
    
    const prompt = promptTemplate
        .replace('${title}', channelData.title)
        .replace('${subs}', parseInt(channelData.stats.subscriberCount).toLocaleString())
        .replace('${views}', parseInt(channelData.stats.viewCount).toLocaleString())
        .replace('${count}', parseInt(channelData.stats.videoCount).toLocaleString())
        .replace('${videoTitles}', videoTitles);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: channelAnalysisSchema
    }
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};


export const getChatStream = async (history: ChatMessage[], newMessage: string, language: Language) => {    
    // @ts-ignore
    const systemInstruction = commonPrompts[language]?.chatSystem || commonPrompts.en.chatSystem;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
        history,
    });

    const result = await chat.sendMessageStream({ message: newMessage });
    return result;
};
