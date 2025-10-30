-- Create medicines table
CREATE TABLE IF NOT EXISTS public.medicines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  strength TEXT[] NOT NULL,
  manufacturer TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  category TEXT NOT NULL,
  authenticity_status TEXT NOT NULL,
  who_approved BOOLEAN NOT NULL,
  side_effects TEXT[] NOT NULL,
  alternatives TEXT[] NOT NULL,
  barcode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create verification_history table
CREATE TABLE IF NOT EXISTS public.verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  verified_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medicines (public read access)
CREATE POLICY "Anyone can view medicines"
  ON public.medicines
  FOR SELECT
  USING (true);

-- RLS Policies for verification_history (users can only see their own)
CREATE POLICY "Users can view their own verification history"
  ON public.verification_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verification history"
  ON public.verification_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_medicines_name ON public.medicines(name);
CREATE INDEX idx_medicines_generic_name ON public.medicines(generic_name);
CREATE INDEX idx_medicines_barcode ON public.medicines(barcode);
CREATE INDEX idx_verification_history_user_id ON public.verification_history(user_id);
CREATE INDEX idx_verification_history_created_at ON public.verification_history(created_at DESC);

-- Insert medicines data
INSERT INTO public.medicines (id, name, generic_name, strength, manufacturer, registration_number, category, authenticity_status, who_approved, side_effects, alternatives, barcode) VALUES
('MED001', 'Paracetamol', 'Acetaminophen', ARRAY['500mg', '650mg'], 'GSK Pakistan', 'DRAP-001234', 'Analgesic', 'verified', true, ARRAY['Nausea', 'Allergic reactions (rare)'], ARRAY['Ibuprofen', 'Aspirin'], '8964000490211'),
('MED002', 'Aspirin', 'Acetylsalicylic Acid', ARRAY['75mg', '100mg', '300mg'], 'Bayer Pakistan', 'DRAP-001567', 'Analgesic', 'verified', true, ARRAY['Stomach upset', 'Bleeding risk'], ARRAY['Paracetamol', 'Ibuprofen'], '8964000491234'),
('MED003', 'Amoxicillin', 'Amoxicillin', ARRAY['250mg', '500mg'], 'Abbott Laboratories', 'DRAP-002345', 'Antibiotic', 'verified', true, ARRAY['Diarrhea', 'Nausea', 'Skin rash'], ARRAY['Azithromycin', 'Cephalexin'], '8964000492345'),
('MED004', 'Metformin', 'Metformin Hydrochloride', ARRAY['500mg', '850mg', '1000mg'], 'Sanofi Pakistan', 'DRAP-003456', 'Antidiabetic', 'verified', true, ARRAY['Diarrhea', 'Nausea', 'Stomach pain'], ARRAY['Glimepiride', 'Sitagliptin'], '8964000493456'),
('MED005', 'Amlodipine', 'Amlodipine Besylate', ARRAY['5mg', '10mg'], 'Pfizer Pakistan', 'DRAP-004567', 'Antihypertensive', 'verified', true, ARRAY['Swelling', 'Fatigue', 'Dizziness'], ARRAY['Losartan', 'Enalapril'], '8964000494567'),
('MED006', 'Omeprazole', 'Omeprazole', ARRAY['20mg', '40mg'], 'AstraZeneca Pakistan', 'DRAP-005678', 'Proton Pump Inhibitor', 'verified', true, ARRAY['Headache', 'Diarrhea', 'Nausea'], ARRAY['Pantoprazole', 'Lansoprazole'], '8964000495678'),
('MED007', 'Calpol', 'Paracetamol', ARRAY['500mg'], 'GSK Pakistan', 'DRAP-006789', 'Analgesic', 'verified', true, ARRAY['Nausea', 'Allergic reactions (rare)'], ARRAY['Panadol', 'Disprol'], '8964000496789'),
('MED008', 'Disprin', 'Aspirin', ARRAY['300mg'], 'Reckitt Benckiser', 'DRAP-007890', 'Analgesic', 'verified', true, ARRAY['Stomach upset', 'Bleeding risk'], ARRAY['Aspirin', 'Paracetamol'], '8964000497890'),
('MED009', 'Augmentin', 'Amoxicillin + Clavulanic Acid', ARRAY['625mg'], 'GSK Pakistan', 'DRAP-008901', 'Antibiotic', 'verified', true, ARRAY['Diarrhea', 'Nausea'], ARRAY['Amoxicillin', 'Azithromycin'], '8964000498901'),
('MED010', 'Glucophage', 'Metformin Hydrochloride', ARRAY['500mg', '850mg'], 'Merck Pakistan', 'DRAP-009012', 'Antidiabetic', 'verified', true, ARRAY['Diarrhea', 'Nausea'], ARRAY['Metformin', 'Glimepiride'], '8964000499012'),
('MED013', 'Losartan', 'Losartan Potassium', ARRAY['25mg', '50mg', '100mg'], 'Getz Pharma', 'DRAP-010345', 'Antihypertensive', 'verified', true, ARRAY['Dizziness', 'Fatigue'], ARRAY['Valsartan', 'Amlodipine'], '8964000491013'),
('MED014', 'Enalapril', 'Enalapril Maleate', ARRAY['5mg', '10mg'], 'Sami Pharmaceuticals', 'DRAP-010789', 'ACE Inhibitor', 'verified', true, ARRAY['Cough', 'Dizziness'], ARRAY['Losartan', 'Captopril'], '8964000491014'),
('MED015', 'Azithromycin', 'Azithromycin', ARRAY['250mg', '500mg'], 'Pfizer Pakistan', 'DRAP-011111', 'Antibiotic', 'verified', true, ARRAY['Nausea', 'Diarrhea'], ARRAY['Clarithromycin', 'Erythromycin'], '8964000491015'),
('MED016', 'Panadol Extra', 'Paracetamol + Caffeine', ARRAY['500mg + 65mg'], 'GSK Pakistan', 'DRAP-011222', 'Analgesic', 'verified', true, ARRAY['Nausea', 'Insomnia'], ARRAY['Disprol', 'Panadol'], '8964000491016'),
('MED017', 'Brufen', 'Ibuprofen', ARRAY['200mg', '400mg', '600mg'], 'Abbott Laboratories', 'DRAP-011333', 'NSAID', 'verified', true, ARRAY['Heartburn', 'Stomach upset'], ARRAY['Aspirin', 'Diclofenac'], '8964000491017'),
('MED018', 'Flagyl', 'Metronidazole', ARRAY['200mg', '400mg'], 'Sanofi Pakistan', 'DRAP-011444', 'Antiprotozoal', 'verified', true, ARRAY['Metallic taste', 'Nausea'], ARRAY['Tinidazole', 'Ciprofloxacin'], '8964000491018'),
('MED019', 'Ciprofloxacin', 'Ciprofloxacin', ARRAY['250mg', '500mg'], 'Sami Pharmaceuticals', 'DRAP-011555', 'Antibiotic', 'verified', true, ARRAY['Nausea', 'Dizziness'], ARRAY['Levofloxacin', 'Ofloxacin'], '8964000491019'),
('MED020', 'Ventolin Inhaler', 'Salbutamol', ARRAY['100mcg/dose'], 'GSK Pakistan', 'DRAP-011666', 'Bronchodilator', 'verified', true, ARRAY['Tremor', 'Increased heart rate'], ARRAY['Bricanyl', 'Seretide'], '8964000491020'),
('MED021', 'Montiget', 'Montelukast Sodium', ARRAY['5mg', '10mg'], 'Getz Pharma', 'DRAP-011777', 'Anti-asthmatic', 'verified', true, ARRAY['Headache', 'Sleep disturbance'], ARRAY['Singulair', 'Cetirizine'], '8964000491021'),
('MED022', 'Cetirizine', 'Cetirizine Hydrochloride', ARRAY['5mg', '10mg'], 'Sami Pharmaceuticals', 'DRAP-011888', 'Antihistamine', 'verified', true, ARRAY['Drowsiness', 'Dry mouth'], ARRAY['Loratadine', 'Fexofenadine'], '8964000491022'),
('MED023', 'Panadol Cold & Flu', 'Paracetamol + Phenylephrine + Caffeine', ARRAY['500mg + 10mg + 25mg'], 'GSK Pakistan', 'DRAP-011999', 'Cold & Flu', 'verified', true, ARRAY['Insomnia', 'Dry mouth'], ARRAY['Disprol C&F', 'Panadol Extra'], '8964000491023'),
('MED024', 'Zyrtec', 'Cetirizine', ARRAY['10mg'], 'UCB Pharma', 'DRAP-012111', 'Antihistamine', 'verified', true, ARRAY['Drowsiness'], ARRAY['Claritin', 'Fexet'], '8964000491024'),
('MED025', 'Augmentin Suspension', 'Amoxicillin + Clavulanic Acid', ARRAY['156mg/5ml'], 'GSK Pakistan', 'DRAP-012222', 'Antibiotic', 'verified', true, ARRAY['Diarrhea', 'Rash'], ARRAY['Cefixime', 'Cefuroxime'], '8964000491025'),
('MED026', 'Ponstan', 'Mefenamic Acid', ARRAY['250mg', '500mg'], 'Pfizer Pakistan', 'DRAP-012333', 'NSAID', 'verified', true, ARRAY['Heartburn', 'Dizziness'], ARRAY['Brufen', 'Naproxen'], '8964000491026'),
('MED027', 'Hydralazine', 'Hydralazine Hydrochloride', ARRAY['25mg', '50mg'], 'Searle Pakistan', 'DRAP-012444', 'Antihypertensive', 'verified', true, ARRAY['Headache', 'Palpitations'], ARRAY['Amlodipine', 'Losartan'], '8964000491027'),
('MED028', 'Clexane', 'Enoxaparin Sodium', ARRAY['40mg/0.4ml'], 'Sanofi Pakistan', 'DRAP-012555', 'Anticoagulant', 'verified', true, ARRAY['Bleeding', 'Bruising'], ARRAY['Heparin', 'Rivaroxaban'], '8964000491028'),
('MED029', 'Neurobion', 'Vitamin B1 + B6 + B12', ARRAY['100mg + 200mg + 200mcg'], 'Merck Pakistan', 'DRAP-012666', 'Vitamin Supplement', 'verified', true, ARRAY['Mild nausea'], ARRAY['Beco', 'Surbex Z'], '8964000491029'),
('MED030', 'Surbex Z', 'Multivitamins + Zinc', ARRAY['Standard dose'], 'Abbott Pakistan', 'DRAP-012777', 'Vitamin Supplement', 'verified', true, ARRAY['Mild stomach upset'], ARRAY['Neurobion', 'Centrum'], '8964000491030'),
('MED031', 'Centrum', 'Multivitamin + Minerals', ARRAY['Standard'], 'Pfizer Pakistan', 'DRAP-012888', 'Multivitamin', 'verified', true, ARRAY['Nausea (rare)'], ARRAY['Surbex Z', 'Neurobion'], '8964000491031'),
('MED032', 'Panadol CF', 'Paracetamol + Phenylephrine + Caffeine', ARRAY['500mg + 10mg + 25mg'], 'GSK Pakistan', 'DRAP-012999', 'Cold & Flu', 'verified', true, ARRAY['Drowsiness', 'Dry mouth'], ARRAY['Disprol CF', 'Panadol Extra'], '8964000491032'),
('MED033', 'Levofloxacin', 'Levofloxacin', ARRAY['250mg', '500mg'], 'Sami Pharmaceuticals', 'DRAP-013000', 'Antibiotic', 'verified', true, ARRAY['Nausea', 'Diarrhea'], ARRAY['Ciprofloxacin', 'Moxifloxacin'], '8964000491033'),
('MED034', 'Risek', 'Omeprazole', ARRAY['20mg', '40mg'], 'Getz Pharma', 'DRAP-013111', 'PPI', 'verified', true, ARRAY['Headache', 'Nausea'], ARRAY['Nexum', 'Losec'], '8964000491034'),
('MED035', 'Nexum', 'Esomeprazole', ARRAY['20mg', '40mg'], 'Getz Pharma', 'DRAP-013222', 'PPI', 'verified', true, ARRAY['Headache', 'Flatulence'], ARRAY['Risek', 'Losec'], '8964000491035'),
('MED036', 'Mosegor', 'Pizotifen Maleate', ARRAY['0.5mg', '1.5mg'], 'Novartis Pakistan', 'DRAP-013333', 'Appetite Stimulant', 'verified', true, ARRAY['Drowsiness', 'Weight gain'], ARRAY['Cyproheptadine', 'Periactin'], '8964000491036'),
('MED037', 'Periactin', 'Cyproheptadine Hydrochloride', ARRAY['4mg'], 'Pfizer Pakistan', 'DRAP-013444', 'Antihistamine', 'verified', true, ARRAY['Sleepiness', 'Dry mouth'], ARRAY['Mosegor', 'Cetirizine'], '8964000491037'),
('MED038', 'Gravinate', 'Dimenhydrinate', ARRAY['50mg'], 'Searle Pakistan', 'DRAP-013555', 'Antiemetic', 'verified', true, ARRAY['Drowsiness', 'Dry mouth'], ARRAY['Domperidone', 'Metoclopramide'], '8964000491038'),
('MED039', 'Motilium', 'Domperidone', ARRAY['10mg'], 'Janssen Pakistan', 'DRAP-013666', 'Antiemetic', 'verified', true, ARRAY['Dry mouth', 'Headache'], ARRAY['Gravinate', 'Metoclopramide'], '8964000491039'),
('MED040', 'Entamizole', 'Diloxanide Furoate + Metronidazole', ARRAY['250mg + 200mg'], 'Sami Pharmaceuticals', 'DRAP-013777', 'Antiprotozoal', 'verified', true, ARRAY['Metallic taste', 'Nausea'], ARRAY['Flagyl', 'Ciprofloxacin'], '8964000491040'),
('MED041', 'Myteka', 'Montelukast', ARRAY['5mg', '10mg'], 'Hilton Pharma', 'DRAP-013888', 'Anti-asthmatic', 'verified', true, ARRAY['Headache', 'Abdominal pain'], ARRAY['Montiget', 'Singulair'], '8964000491041'),
('MED042', 'Panadol Syrup', 'Paracetamol', ARRAY['120mg/5ml'], 'GSK Pakistan', 'DRAP-013999', 'Analgesic (Pediatric)', 'verified', true, ARRAY['Nausea'], ARRAY['Calpol', 'Disprol'], '8964000491042'),
('MED043', 'Augmentin DS', 'Amoxicillin + Clavulanic Acid', ARRAY['875mg + 125mg'], 'GSK Pakistan', 'DRAP-014111', 'Antibiotic', 'verified', true, ARRAY['Diarrhea', 'Rash'], ARRAY['Cefuroxime', 'Azithromycin'], '8964000491043'),
('MED044', 'Nexum IV', 'Esomeprazole Sodium', ARRAY['40mg/vial'], 'Getz Pharma', 'DRAP-014222', 'IV PPI', 'verified', true, ARRAY['Injection site pain'], ARRAY['Risek IV', 'Losec IV'], '8964000491044'),
('MED045', 'Insulatard', 'Human Insulin (NPH)', ARRAY['100IU/ml'], 'Novo Nordisk', 'DRAP-014333', 'Antidiabetic (Insulin)', 'verified', true, ARRAY['Hypoglycemia'], ARRAY['Mixtard', 'Lantus'], '8964000491045'),
('MED046', 'Mixtard', 'Biphasic Human Insulin', ARRAY['70/30', '100IU/ml'], 'Novo Nordisk', 'DRAP-014444', 'Insulin', 'verified', true, ARRAY['Hypoglycemia'], ARRAY['Lantus', 'Humulin'], '8964000491046'),
('MED047', 'Lantus', 'Insulin Glargine', ARRAY['100IU/ml'], 'Sanofi Pakistan', 'DRAP-014555', 'Long-acting Insulin', 'verified', true, ARRAY['Hypoglycemia'], ARRAY['Mixtard', 'Insulatard'], '8964000491047'),
('MED048', 'Lipiget', 'Atorvastatin', ARRAY['10mg', '20mg', '40mg'], 'Getz Pharma', 'DRAP-014666', 'Lipid-lowering', 'verified', true, ARRAY['Muscle pain', 'Fatigue'], ARRAY['Crestor', 'Simvastatin'], '8964000491048'),
('MED049', 'Crestor', 'Rosuvastatin', ARRAY['5mg', '10mg', '20mg'], 'AstraZeneca Pakistan', 'DRAP-014777', 'Lipid-lowering', 'verified', true, ARRAY['Muscle pain'], ARRAY['Lipiget', 'Simvastatin'], '8964000491049'),
('MED050', 'Voltral', 'Diclofenac Sodium', ARRAY['50mg', '75mg'], 'Novartis Pakistan', 'DRAP-014888', 'NSAID', 'verified', true, ARRAY['Stomach pain', 'Nausea'], ARRAY['Brufen', 'Ponstan'], '8964000491050'),
('MED051', 'Disprol', 'Paracetamol', ARRAY['500mg'], 'Reckitt Benckiser', 'DRAP-014999', 'Analgesic', 'verified', true, ARRAY['Nausea'], ARRAY['Panadol', 'Calpol'], '8964000491051'),
('MED052', 'Moxiget', 'Moxifloxacin', ARRAY['400mg'], 'Getz Pharma', 'DRAP-015111', 'Antibiotic', 'verified', true, ARRAY['Nausea', 'Headache'], ARRAY['Levofloxacin', 'Ciprofloxacin'], '8964000491052'),
('MED053', 'Cefspan', 'Cefixime', ARRAY['200mg', '400mg'], 'Getz Pharma', 'DRAP-015222', 'Antibiotic', 'verified', true, ARRAY['Diarrhea'], ARRAY['Augmentin', 'Cefuroxime'], '8964000491053'),
('MED054', 'Caltrate', 'Calcium Carbonate + Vitamin D3', ARRAY['600mg + 400IU'], 'Pfizer Pakistan', 'DRAP-015333', 'Supplement', 'verified', true, ARRAY['Constipation'], ARRAY['Osteocare', 'Bonate'], '8964000491054'),
('MED055', 'Osteocare', 'Calcium + Vitamin D3 + Zinc + Magnesium', ARRAY['Standard'], 'Vitabiotics Pakistan', 'DRAP-015444', 'Supplement', 'verified', true, ARRAY['Constipation'], ARRAY['Caltrate', 'Bonate'], '8964000491055'),
('MED056', 'Risek IV', 'Omeprazole Sodium', ARRAY['40mg/vial'], 'Getz Pharma', 'DRAP-015555', 'PPI Injection', 'verified', true, ARRAY['Injection site pain'], ARRAY['Nexum IV', 'Losec IV'], '8964000491056'),
('MED057', 'Xalatan', 'Latanoprost', ARRAY['0.005%'], 'Pfizer Pakistan', 'DRAP-015666', 'Ophthalmic (Glaucoma)', 'verified', true, ARRAY['Eye redness'], ARRAY['Travatan', 'Lumigan'], '8964000491057'),
('MED058', 'Travatan', 'Travoprost', ARRAY['0.004%'], 'Alcon Pakistan', 'DRAP-015777', 'Ophthalmic', 'verified', true, ARRAY['Eye irritation'], ARRAY['Xalatan', 'Lumigan'], '8964000491058'),
('MED059', 'Lumigan', 'Bimatoprost', ARRAY['0.03%'], 'Allergan Pakistan', 'DRAP-015888', 'Ophthalmic', 'verified', true, ARRAY['Eye redness'], ARRAY['Travatan', 'Xalatan'], '8964000491059'),
('MED060', 'Folic Acid', 'Vitamin B9', ARRAY['5mg'], 'Sami Pharmaceuticals', 'DRAP-015999', 'Supplement', 'verified', true, ARRAY['None significant'], ARRAY['Multivitamins', 'Neurobion'], '8964000491060');
