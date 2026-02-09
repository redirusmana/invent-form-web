"use client";

import React, { useMemo } from "react";
import { useForm, useFieldArray, useWatch, type Path } from "react-hook-form";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Plus,
  Trash2,
  Send,
  RotateCcw,
  Search,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Package,
  AlertTriangle, // Icon untuk warning
} from "lucide-react";

import { cn } from "@/lib/utils";

// --- UI IMPORTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import productsData from "@/app/data/products.json";

// --- DATA SOURCE ---

type InventoryItem = {
  name: string;
  boxes: string;
  units: string;
  status: "checking" | "done";
};

type InventoryFormValues = {
  date: Date;
  items: InventoryItem[];
};

export default function InventoryPage() {
  const PRODUCT_LIST = productsData;

  const form = useForm<InventoryFormValues>({
    defaultValues: {
      date: new Date(),
      items: [{ name: "", boxes: "0", units: "", status: "checking" }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Pantau perubahan pada array items
  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });

  // --- LOGIC DETEKSI DUPLIKAT (NEW) ---
  const duplicateIndices = useMemo(() => {
    const indices = new Set<number>();
    const nameMap = new Map<string, number[]>();

    watchedItems?.forEach((item, index) => {
      // Normalisasi nama (lowercase & trim) agar "Knee 1/2" dan "knee 1/2 " dianggap sama
      const name = item.name?.trim().toLowerCase();
      if (name) {
        if (!nameMap.has(name)) {
          nameMap.set(name, []);
        }
        nameMap.get(name)?.push(index);
      }
    });

    // Jika ada nama yang muncul lebih dari 1 kali, tandai semua index-nya
    nameMap.forEach((indexes) => {
      if (indexes.length > 1) {
        indexes.forEach((idx) => indices.add(idx));
      }
    });

    return indices;
  }, [watchedItems]);

  const hasDuplicates = duplicateIndices.size > 0;
  const hasCheckingItems =
    watchedItems?.some((item) => item.status === "checking") ?? false;

  // Block tombol jika ada Checking ATAU ada Duplikat
  const isSubmitDisabled = hasCheckingItems || hasDuplicates;

  const handleGenerateWA = (data: InventoryFormValues) => {
    if (isSubmitDisabled) return;

    const validItems = data.items.filter(
      (item) => item.name && item.name.trim() !== "",
    );
    if (validItems.length === 0) {
      alert("Isi minimal satu barang!");
      return;
    }

    const formattedDate = format(data.date, "dd MMMM yyyy", { locale: id });
    let text = `*Laporan ${formattedDate}* 📦\n------------------------\n\n`;

    validItems.forEach((item, index) => {
      const productInfo = PRODUCT_LIST.find((p) => p.name === item.name);
      const qtyInfo =
        productInfo && productInfo.qty > 0
          ? `(Isi: ${productInfo.qty}/Dus)`
          : "";

      text += `*${index + 1}. ${item.name}*\n`;
      text += `   📦 Dus: ${item.boxes} ${qtyInfo}\n`;
      text += `   ⚙️ PCS: ${item.units || "-"}\n\n`;
    });

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleReset = () => {
    if (confirm("Reset semua data?")) form.reset();
  };

  const [filteredProducts, setFilteredProducts] = React.useState<
    typeof PRODUCT_LIST
  >([]);

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value.toLowerCase();
    form.setValue(`items.${index}.name`, e.target.value);

    if (value.length > 1) {
      const results = PRODUCT_LIST.filter((item) =>
        item.name.toLowerCase().includes(value),
      ).slice(0, 20);
      setFilteredProducts(results);
    } else {
      setFilteredProducts([]);
    }
  };

  const renderButtonContent = () => {
    if (hasDuplicates) {
      return (
        <>
          <AlertTriangle className="mr-2 h-5 w-5 animate-pulse text-red-500" />
          <span className="text-red-500">Perbaiki Duplikat Dulu...</span>
        </>
      );
    }

    if (hasCheckingItems) {
      return (
        <>
          <AlertCircle className="mr-2 h-5 w-5 animate-pulse" />
          Selesaikan Pengecekan...
        </>
      );
    }

    return (
      <>
        <Send className="mr-2 h-5 w-5" /> Kirim Laporan WhatsApp
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] py-8 px-4 font-sans flex justify-center items-start">
      <Card className="w-full max-w-5xl shadow-xl border-[#d6d3d1] bg-[#fffbf2]">
        {/* HEADER */}
        <CardHeader className="flex flex-row items-center justify-between p-6 bg-[#4a403a] text-[#fefce8] rounded-t-xl border-b border-[#5d534a]">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Package className="h-8 w-8 text-amber-400" />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl md:text-3xl font-bold tracking-wide text-amber-50 leading-none">
                Stok Gudang
              </CardTitle>
              <CardDescription className="text-amber-200/70 text-sm font-medium leading-tight">
                Input data harian material toko
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="text-stone-400 hover:text-white hover:bg-[#5d534a] rounded-full"
            title="Reset Form"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleGenerateWA)}
              className="space-y-6"
            >
              {/* TANGGAL */}
              <div className="flex flex-col space-y-2">
                <span className="text-sm font-bold text-stone-600 uppercase tracking-wide">
                  Tanggal Laporan
                </span>
                <FormField
                  control={form.control}
                  name="date"
                  rules={{ required: "Tanggal wajib diisi" }}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full md:w-75 justify-start text-left font-semibold border-stone-300 bg-white hover:bg-stone-50 text-stone-700 h-11 shadow-sm",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                              {field.value ? (
                                format(field.value, "dd MMMM yyyy", {
                                  locale: id,
                                })
                              ) : (
                                <span>Pilih tanggal</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="bg-stone-200" />

              <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-xs font-bold text-stone-500 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">Nama Barang</div>
                <div className="col-span-2 text-center">Dus</div>
                <div className="col-span-2 text-center">Satuan</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-center">Hapus</div>
              </div>

              {/* LIST ITEMS */}
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const status = watchedItems?.[index]?.status || "checking";
                  const isDone = status === "done";

                  // CEK DUPLIKAT PER ITEM
                  const isDuplicate = duplicateIndices.has(index);

                  return (
                    <Card
                      key={field.id}
                      className={cn(
                        "grid grid-cols-12 gap-3 p-4 items-center border shadow-sm transition-all hover:shadow-md relative",
                        "bg-white border-stone-200",
                        isDone && "bg-emerald-50/40 border-emerald-200",
                        isDuplicate && "bg-red-50 border-red-500 border-2",
                      )}
                    >
                      {isDuplicate && (
                        <div className="absolute -top-3 left-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-sm z-10">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          DUPLIKAT
                        </div>
                      )}

                      {/* NO */}
                      <div className="col-span-12 md:col-span-1 flex md:block justify-between items-center mb-1 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-stone-400">
                          NO
                        </span>
                        <div
                          className={cn(
                            "font-mono text-xs font-bold rounded-lg w-7 h-7 flex items-center justify-center mx-auto border",
                            isDuplicate
                              ? "bg-red-100 text-red-600 border-red-200"
                              : "bg-stone-100 text-stone-500 border-stone-200",
                          )}
                        >
                          {index + 1}
                        </div>
                      </div>

                      {/* NAMA BARANG */}
                      <div className="col-span-12 md:col-span-4 relative">
                        <FormField
                          control={form.control}
                          name={
                            `items.${index}.name` as Path<InventoryFormValues>
                          }
                          rules={{ required: "Nama barang wajib diisi" }}
                          render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <Search
                                  className={cn(
                                    "absolute left-3 top-2.5 h-4 w-4",
                                    isDuplicate
                                      ? "text-red-400"
                                      : "text-stone-400",
                                  )}
                                />
                                <FormControl>
                                  <Input
                                    {...field}
                                    list={`product-list-${index}`}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleSearchChange(e, index);
                                    }}
                                    onFocus={(e) =>
                                      handleSearchChange(e, index)
                                    }
                                    value={field.value as string}
                                    placeholder="Cari barang..."
                                    className={cn(
                                      "pl-9 h-10 focus-visible:ring-amber-500 font-medium",
                                      isDuplicate
                                        ? "bg-white border-red-300 text-red-700 placeholder:text-red-300 focus-visible:ring-red-500"
                                        : "bg-white border-stone-300 text-stone-700",
                                    )}
                                    autoComplete="off"
                                  />
                                </FormControl>
                                <datalist id={`product-list-${index}`}>
                                  {filteredProducts.map((prod, i) => (
                                    <option
                                      key={prod.name + i}
                                      value={prod.name}
                                      label={
                                        prod.qty > 0
                                          ? `📦 Isi: ${prod.qty}`
                                          : undefined
                                      }
                                    />
                                  ))}
                                </datalist>
                              </div>
                              {/* Pesan Error Duplikat di Bawah Input */}
                              {isDuplicate && (
                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">
                                  * Barang ini sudah diinput di baris lain
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* DUS */}
                      <div className="col-span-6 md:col-span-2">
                        <FormField
                          control={form.control}
                          name={
                            `items.${index}.boxes` as Path<InventoryFormValues>
                          }
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    inputMode="numeric"
                                    value={field.value as string}
                                    className="h-10 text-center bg-white border-stone-300 focus-visible:ring-amber-500 font-bold text-stone-700"
                                  />
                                  <span className="absolute right-3 top-2.5 text-[10px] text-stone-400 font-bold pointer-events-none">
                                    BOX
                                  </span>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* SATUAN */}
                      <div className="col-span-6 md:col-span-2">
                        <FormField
                          control={form.control}
                          name={
                            `items.${index}.units` as Path<InventoryFormValues>
                          }
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    value={field.value as string}
                                    className="h-10 text-center bg-white border-stone-300 focus-visible:ring-amber-500 font-bold text-stone-700"
                                    placeholder="-"
                                  />
                                  <span className="absolute right-3 top-2.5 text-[10px] text-stone-400 font-bold pointer-events-none">
                                    PCS
                                  </span>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* STATUS */}
                      <div className="col-span-12 md:col-span-2">
                        <FormField
                          control={form.control}
                          name={
                            `items.${index}.status` as Path<InventoryFormValues>
                          }
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value as string}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className={cn(
                                      "font-bold uppercase text-xs h-10",
                                      field.value === "done"
                                        ? "bg-emerald-600 text-white border-emerald-600 focus:ring-emerald-500"
                                        : "bg-amber-100 text-amber-700 border-amber-300 focus:ring-amber-500",
                                    )}
                                  >
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="checking">
                                    <span className="flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-amber-500" />{" "}
                                      Checking
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="done">
                                    <span className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />{" "}
                                      Done
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* DELETE */}
                      <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-dashed border-stone-200 mt-2 md:mt-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-stone-400 hover:text-red-600 hover:bg-red-50"
                          title="Hapus Baris"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    name: "",
                    boxes: "0",
                    units: "",
                    status: "checking",
                  })
                }
                className="w-full border-dashed border-2 border-stone-300 text-stone-500 hover:text-amber-700 hover:border-amber-400 hover:bg-white h-14 bg-[#fafaf9]"
              >
                <Plus className="mr-2 h-5 w-5" /> Tambah Item Baru
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="p-4 md:p-6 bg-white border-t border-stone-200 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button
            onClick={form.handleSubmit(handleGenerateWA)}
            disabled={isSubmitDisabled}
            className={cn(
              "w-full h-14 text-lg font-bold shadow-md transition-all",
              isSubmitDisabled
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-amber-700 hover:bg-amber-800 text-white hover:shadow-lg",
            )}
          >
            {renderButtonContent()}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
