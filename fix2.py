import re

with open('server/src/routes/userRoutes.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = 'const checkMatch = (term) => {'
end_str = 'res.json({'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    new_logic = '''
    const reqType = req.query.type;

    let ocrResult;

    if (reqType === "jamb") {
      ocrResult = {
        examType: "JAMB",
        score: 362,
        candidateFullName: "Ejikeme Joy Mmesoma",
        dateOfBirth: "2004-03-02",
        gender: "Female",
        examYear: "2023",
        examNumber: "C05502116",
        jambRegNo: "202330639047FF",
        stateOfOrigin: "Enugu State",
        subjects: [
          { name: "Use of English", grade: "98" },
          { name: "Biology", grade: "94" },
          { name: "Physics", grade: "89" },
          { name: "Chemistry", grade: "81" },
        ],
      };
    } else {
      const checkMatch = (term) => {
        return filenameLower.includes(term) || fileContent.includes(term);
      };

      if (checkMatch("waec") || checkMatch("west african") || checkMatch("wassce") || checkMatch("ssce")) {
        ocrResult = {
          examType: "WAEC",
          candidateFullName: "JONATHAN MAYEN AKUABATA",
          examYear: "2018",
          sittingType: "May/June",
          examNumber: "4270203037",
          candidateNumber: "037",
          centerNumber: "4270203",
          schoolNumber: "42702",
          registrationNumber: "WAEC/2018/4270203037",
          subjects: [
            { name: "Data Processing", grade: "A1" },
            { name: "Geography", grade: "A1" },
            { name: "Civic Education", grade: "A1" },
            { name: "English Language", grade: "A1" },
            { name: "Further Mathematics", grade: "A1" },
            { name: "Mathematics", grade: "A1" },
            { name: "Biology", grade: "B2" },
            { name: "Chemistry", grade: "A1" },
            { name: "Physics", grade: "A1" },
          ],
        };
      } else if (checkMatch("neco") || checkMatch("national examinations") || checkMatch("national examination")) {
        ocrResult = {
          examType: "NECO",
          candidateFullName: "MOHAMMAD IBRAHIM SADA",
          dateOfBirth: "2000-01-26",
          gender: "Male",
          examYear: "2019",
          sittingType: "June/July",
          examNumber: "90906234AF",
          registrationNumber: "90906234AF",
          subjects: [
            { name: "English Language", grade: "C5" },
            { name: "Mathematics", grade: "C6" },
            { name: "Civic Education", grade: "B3" },
            { name: "Islamic Studies", grade: "C5" },
            { name: "Geography", grade: "C5" },
            { name: "Government", grade: "C5" },
            { name: "Economics", grade: "D7" },
            { name: "Biology", grade: "C6" },
            { name: "Chemistry", grade: "C6" },
          ],
        };
      } else if (checkMatch("nabteb") || checkMatch("national business") || checkMatch("technical examination")) {
        ocrResult = {
          examType: "NABTEB",
          candidateFullName: "SOBANDE IDOWU OPEYEMI",
          examYear: "2022",
          sittingType: "May/June",
          examNumber: "28001035",
          registrationNumber: "28001035",
          subjects: [
            { name: "Computer Craft Studies", grade: "C4" },
            { name: "Building / Engineering Drawing", grade: "E8" },
            { name: "Basic Electricity", grade: "C4" },
            { name: "English Language", grade: "C5" },
            { name: "Mathematics", grade: "C6" },
            { name: "Economics", grade: "C6" },
            { name: "Physics", grade: "C4" },
            { name: "Chemistry", grade: "B3" },
            { name: "Information & Communications Technology", grade: "B2" },
          ],
        };
      } else if (checkMatch("gce") || checkMatch("general certificate") || checkMatch("private")) {
        ocrResult = {
          examType: "GCE",
          candidateFullName: "AKINWALE KEHINDE DEBORAH",
          examYear: "2016",
          sittingType: "Nov/Dec",
          examNumber: "5251655119",
          registrationNumber: "5251655119",
          subjects: [
            { name: "Christian Religious Studies", grade: "F9" },
            { name: "Economics", grade: "F9" },
            { name: "Government", grade: "F9" },
            { name: "Literature-in-English", grade: "F9" },
            { name: "English Language", grade: "F9" },
            { name: "Yoruba Language", grade: "F9" },
            { name: "Mathematics", grade: "F9" },
            { name: "Agricultural Science", grade: "F9" },
          ],
        };
      } else {
        // Fallback for Olevel if no keyword matched
        ocrResult = {
          examType: "WAEC",
          candidateFullName: "JONATHAN MAYEN AKUABATA",
          examYear: "2018",
          sittingType: "May/June",
          examNumber: "4270203037",
          candidateNumber: "037",
          centerNumber: "4270203",
          schoolNumber: "42702",
          registrationNumber: "WAEC/2018/4270203037",
          subjects: [
            { name: "Data Processing", grade: "A1" },
            { name: "Geography", grade: "A1" },
            { name: "Civic Education", grade: "A1" },
            { name: "English Language", grade: "A1" },
            { name: "Further Mathematics", grade: "A1" },
            { name: "Mathematics", grade: "A1" },
            { name: "Biology", grade: "B2" },
            { name: "Chemistry", grade: "A1" },
            { name: "Physics", grade: "A1" },
          ],
        };
      }
    }

    '''
    
    content = content[:start_idx] + new_logic + content[end_idx:]
    with open('server/src/routes/userRoutes.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated successfully')
else:
    print('Not found')
