import { supabase } from "@/lib/supabase";

export default async function analysis(amount) {

 
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  console.log(today); 
  
  

  const { data: existingRow, error: fetchError } = await supabase
    .from("analysis")
    .select("*")
    .eq("date", today)
    .maybeSingle();  

  if (fetchError) {
    console.error("Error fetching row:", fetchError);
    return;
  }

  if (existingRow) {
    
    const { error: updateError } = await supabase
      .from("analysis")
      .update({
        amount: existingRow.amount + Number(amount),
      })
      .eq("date", today);

    if (updateError) console.error("Error updating row:", updateError);
  } else {
 
    const { error: insertError } = await supabase
      .from("analysis")
      .insert([{ date: today, amount: Number(amount) }]);

    if (insertError) console.error("Error inserting row:", insertError);
  }
}
