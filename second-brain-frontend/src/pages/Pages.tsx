
export type TextSegment = { text: string; bold?: boolean; italic?: boolean };

export type Block =
  | { id: string; type: "heading"; level: 1 | 2 | 3; content: TextSegment[] }
  | { id: string; type: "paragraph"; content: TextSegment[] }
  | { id: string; type: "code"; language: string; code: string }
  | { id: string; type: "bulleted_list_item"; content: TextSegment[] };

type NoteContent = { blocks: Block[] };


const displayBlock: Block[] = [
  {
    id: "1",
    type: "heading",
    level: 1,
    content: [
      {
        text: "Hello this is me "
      },
    ]
  },
]


function BlockRender(blocks: Block[]){

  blocks.map((block) => {
    switch (block.type) {
    case "heading":
      return <h2>{block.content[0].text}</h2>;
    }})
  
}

BlockRender(displayBlock)
