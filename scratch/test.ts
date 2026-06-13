import { convertAIToCanvas } from '../src/lib/layout-engine';

const input = `(a) Which Addressing Mode is used for accessing array elements in sequence?

(b) In a Relative (PC-relative) addressing mode, there is a BR 20 instruction (instruction length = 1 word) at word address 205F (Hex). What will be the content of the Program Counter after execution of the instruction? (Assume 20 is in decimal.)

Part (a)
Theory

When accessing array elements sequentially, we usually use Indexed Addressing Mode.

In Indexed Addressing:

EA=A+Index Register

where

A = Base address of array
Index Register = Position of the required element

As the index register changes, the CPU accesses the next array element.

Therefore, Indexed Addressing is ideal for:

Arrays
Tables
Lists
Answer
Indexed Addressing Mode
	

Part (b)
Theory of Relative (PC-Relative) Addressing

In PC-relative addressing:

EA=PC+Displacement

For a branch instruction:

PC
new
	

=PC
next
	

+Displacement

where PC
next
	

 is the address of the next instruction after fetching the current instruction.

Given

Instruction:

BR 20

Instruction address:

205F
H
	


Instruction length:

1 word

Displacement:

20
10
	

Step 1: Find PC after Fetch

Since instruction length = 1 word,

PC
next
	

=205F
H
	

+1
=2060
H
	

Step 2: Convert Displacement to Hex
20
10
	

=14
H
	

Step 3: Compute New PC
PC=2060
H
	

+14
H
	

PC=2074
H
	

Exam Answer
(a)

Array elements are generally accessed using Indexed Addressing Mode.

Indexed Addressing Mode
	

(b)

Given:

Instruction address = 205F
H
	

Instruction length = 1 word
Displacement = 20
10
	

=14
H
	


After fetching the instruction:

PC=2060
H
	


Using PC-relative addressing:

PC
new
	

=2060
H
	

+14
H
	

PC
new
	

=2074
H
	

Final Answer
PC=2074
H`;

async function test() {
  console.log("SENDING REQUEST TO API...");
  const res = await fetch("http://localhost:3001/api/generate-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: input, style: "colorful" })
  });
  
  if (!res.ok) {
    console.error("API failed", await res.text());
    return;
  }
  
  const json = await res.json();
  console.log("================== AI JSON OUTPUT ==================");
  console.log(JSON.stringify(json.data, null, 2));
  
  console.log("\n================== LAYOUT ENGINE ==================");
  const elements = convertAIToCanvas(json.data);
  let totalHeight = 0;
  
  for (const el of elements) {
    if (el.type === 'rectangle') {
      console.log(`[BOX] y: ${el.y}, height: ${el.height}`);
      totalHeight = Math.max(totalHeight, el.y + el.height);
    }
    if (el.type === 'text') {
      console.log(`[TEXT] y: ${el.y}, height: ${el.height}, lines: ${el.text.split('\\n').length}`);
      console.log(`       Preview: ${el.text.substring(0, 50).replace(/\\n/g, ' ')}...`);
    }
  }
}

test().catch(console.error);
