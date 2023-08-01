export const truncateText = (sentence: string) => sentence.length >= 33 ? sentence.slice(0, 33).concat('...') : sentence;
