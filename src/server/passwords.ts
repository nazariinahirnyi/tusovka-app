import argon2 from "argon2";

const DUMMY_HASH =
  "$argon2id$v=19$m=4096,t=2,p=1$ck+4R94XzL30jllTkDKphA$an7GP/Nv8EqQpi5zgARo63cwPZblcV6YUK8bY0+4ato";

function argonOptions() {
  const memoryCost = Number(process.env.TUSOVKA_HASH_MEMORY ?? 19456);
  return {
    type: argon2.argon2id as 2,
    memoryCost: Number.isFinite(memoryCost) && memoryCost >= 4096 ? memoryCost : 19456,
    timeCost: 2,
    parallelism: 1,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, argonOptions());
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function dummyVerify(password: string): Promise<void> {
  try {
    await argon2.verify(DUMMY_HASH, password);
  } catch {
    // Timing cover only.
  }
}
