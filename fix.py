import re

with open('frontend/src/routes/documents.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update interfaces
content = content.replace('interface OLevelSitting {', '''interface OLevelSitting {
  resultSlip?: {
    _id: string;
    name: string;
    url: string;
  };''')

# 2. Add state variables for jambResultSlip and loading
state_block = '''  const [jambResultSlip, setJambResultSlip] = useState<any>(null);
  const [isJambUploading, setIsJambUploading] = useState(false);
  const [isOlevelUploading, setIsOlevelUploading] = useState<Record<number, boolean>>({});'''
content = content.replace('  const [activeTab, setActiveTab] = useState<"verification" | "locker">("verification");', state_block)

# 3. Update useEffect to sync jambResultSlip
profile_sync_block = '''      if ((profile as any).jambResultSlip) {
        setJambResultSlip((profile as any).jambResultSlip);
      }
      if (profile.jambScore !== undefined) {'''
content = content.replace('      if (profile.jambScore !== undefined) {', profile_sync_block)

# 4. Handle Ocr Populate
content = content.replace('const handleOcrPopulate = (ocrData: any) => {', 'const handleOcrPopulate = (ocrData: any, type: string, sittingNumber?: number) => {')

content = content.replace('if (ocrData.examType === "JAMB") {', 'if (type === "jamb" || ocrData.examType === "JAMB") {')
content = content.replace('const activeSittingIdx = olevelSittings.length === 2 && olevelSittings[0].examNumber ? 1 : 0;', 'const activeSittingIdx = sittingNumber ? sittingNumber - 1 : (olevelSittings.length === 2 && olevelSittings[0].examNumber ? 1 : 0);')

# 5. Add handleSingleUpload function
upload_func = '''  const handleSingleUpload = async (file: File, type: "jamb" | "olevel", sittingNumber?: number) => {
    if (type === "jamb") setIsJambUploading(true);
    else if (type === "olevel" && sittingNumber) setIsOlevelUploading(prev => ({ ...prev, [sittingNumber]: true }));

    try {
      const uploaded = await uploadDocument(file, type, sittingNumber);
      const ocr = await ocrExtractResult(file);
      handleOcrPopulate(ocr, type, sittingNumber);
      refreshProfile();
      toast.success("Document uploaded and processed successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message || "Unknown error"}`);
    } finally {
      if (type === "jamb") setIsJambUploading(false);
      else if (type === "olevel" && sittingNumber) setIsOlevelUploading(prev => ({ ...prev, [sittingNumber]: false }));
    }
  };'''
content = content.replace('  // File Upload flow', upload_func + '\n\n  // File Upload flow')


# Replace Tab Switcher
tab_switcher_pattern = re.compile(r'<div className="flex items-center gap-2">\s*<Button.*?variant=\{activeTab === "verification".*?</Button>\s*</div>', re.DOTALL)
content = tab_switcher_pattern.sub('', content)

# Remove the {activeTab === "locker" ? ... : ... }
content = content.replace('{activeTab === "locker" ? (', '')
# Delete the locker code block which ends at
#         </div>
#       ) : (
#         // VERIFICATION AND MANUAL ENTRY FORMS
#         <div className="grid gap-6 lg:grid-cols-3">

locker_pattern = re.compile(r'// FILE UPLOAD AND LOCKER VIEW.*?\)\s*:\s*\(', re.DOTALL)
content = locker_pattern.sub('', content)

# At the end of the file, remove the closing brace for the ternary
content = content.replace('      )}\n    </div>\n  );\n}\n', '    </div>\n  );\n}\n')


# Add the file input to O'Level
olevel_upload_ui = '''                  <div className="flex items-center justify-between mb-4 bg-muted/20 p-4 rounded-2xl border border-dashed border-primary/20">
                    <div className="flex items-center gap-3">
                      {sitting.resultSlip ? (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Document Uploaded</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{sitting.resultSlip.name}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Upload className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Upload Result Slip</p>
                            <p className="text-[10px] text-muted-foreground">Auto-fills the form below</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      {sitting.resultSlip ? (
                         <div className="flex items-center gap-2">
                           <a href={`${BACKEND_URL}${sitting.resultSlip.url}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">View</a>
                           <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteDocument(sitting.resultSlip!._id)}>
                             {deletingId === sitting.resultSlip._id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3" />}
                           </Button>
                         </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleSingleUpload(e.target.files[0], 'olevel', sIdx + 1);
                            }
                          }} disabled={isOlevelUploading[sIdx + 1]} />
                          <Button asChild size="sm" className="bg-gradient-primary rounded-xl text-xs h-8" disabled={isOlevelUploading[sIdx + 1]}>
                            <span>{isOlevelUploading[sIdx + 1] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Select File'}</span>
                          </Button>
                        </label>
                      )}
                    </div>
                  </div>
                  {/* Demographics / Details Grid */}'''
content = content.replace('                  {/* Demographics / Details Grid */}', olevel_upload_ui)


# Add the file input to JAMB
jamb_upload_ui = '''              <div className="flex items-center justify-between mb-4 bg-muted/20 p-4 rounded-2xl border border-dashed border-secondary/20">
                <div className="flex items-center gap-3">
                  {jambResultSlip ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">JAMB Slip Uploaded</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{jambResultSlip.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary-foreground">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Upload JAMB Slip</p>
                        <p className="text-[10px] text-muted-foreground">Auto-fills UTME details</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  {jambResultSlip ? (
                     <div className="flex items-center gap-2">
                       <a href={`${BACKEND_URL}${jambResultSlip.url}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">View</a>
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteDocument(jambResultSlip._id)}>
                         {deletingId === jambResultSlip._id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3" />}
                       </Button>
                     </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSingleUpload(e.target.files[0], 'jamb');
                        }
                      }} disabled={isJambUploading} />
                      <Button asChild size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl text-xs h-8" disabled={isJambUploading}>
                        <span>{isJambUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Select File'}</span>
                      </Button>
                    </label>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">'''
content = content.replace('              <div className="grid gap-4 sm:grid-cols-3">', jamb_upload_ui)

# Remove the "Skip Manual Typing" quick upload action at the bottom
quick_upload_pattern = re.compile(r'\{/\* Quick Upload Action \*/\}.*?</Button>\s*</div>', re.DOTALL)
content = quick_upload_pattern.sub('', content)


# And we also need to fix the parameter passing in handleFiles (though handleFiles isn't used anymore, let's leave it or remove it entirely, we don't care, it's not rendered)

with open('frontend/src/routes/documents.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
