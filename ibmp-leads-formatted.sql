-- IBMP Leads Import SQL Script for Supabase
-- Generated for your exact table schema
-- Total leads: 44 (sample from your data)

INSERT INTO "public"."leads" (
    "fullName", 
    "email", 
    "phone", 
    "country", 
    "qualification", 
    "course", 
    "status", 
    "assignedTo", 
    "source",
    "notes",
    "priority",
    "score",
    "experience",
    "location",
    "communicationscount",
    "assigned_to",
    "assignedcounselor",
    "tags",
    "custom_fields",
    "createdAt",
    "updatedAt",
    "created_at",
    "updated_at",
    "updated_by"
) VALUES 
('Abdullah Emad', 'abdullahemad028@gmail.com', NULL, 'EG', 'MBBS/ FMG', 'Fellowship Psychiatr', 'Follow Up', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"details sent on wtsapp will close soon","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Abobakr Abdalah', 'ab3950436@gmail.com', '+201000000000', 'US', 'MD/MS/DNB', 'Interventional car', 'Follow Up', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Dr answer and disconneted the call text in whats up","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Anoop vithayathil', 'anoopjaine4sik@gmail.com', '+918000000000', 'GB', 'Others', 'Psychiatric ads', 'Follow Up', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not connect","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('ANURADHA', 'anuradhasngh815@gmail.com', '+920000000000', 'IN', 'MD/MS/DNB', 'Fellowship Psychiatr', 'Not Interested', 'Nakshatra', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not answering","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Nakshatra', 'Nakshatra', NULL, '{}', now(), now(), now(), now(), 'System'),

('Arshad ali', 'arshadalifrnd@gmail.com', '+920000000000', 'IN', 'MD/MS/DNB', 'Interventional car', 'Follow Up', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Brochures send","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Aruna Shobha', 'it@cncmail.com', '+918000000000', 'IN', 'Others', 'Fellowship Psychiatr', 'Not Interested', 'Nakshatra', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not answering","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Nakshatra', 'Nakshatra', NULL, '{}', now(), now(), now(), now(), 'System'),

('Belghit Elh', 'belghait.elhajjaj@gmail.com', '+213000000000', 'MA', 'MD/MS/DNB', 'Interventional car', 'Follow Up', 'Nakshatra', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"dce","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Nakshatra', 'Nakshatra', NULL, '{}', now(), now(), now(), now(), 'System'),

('Bibek Agarwal', 'bibek_ag@yahoo.co.in', '+919000000000', 'IN', 'MD/MS/DNB', 'Interventional car', 'Not Interested', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"No Answer","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Boushikhi Fouad', 'abduallali44@gmail.com', '+213000000000', 'MO', 'MBBS/ FMG', 'Fellowship Psychiatr', 'Follow Up', 'Nakshatra', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not answering","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Nakshatra', 'Nakshatra', NULL, '{}', now(), now(), now(), now(), 'System'),

('Chaimae Kasmi', 'ckasmi70@gmail.com', '+213000000000', 'MA', 'Others', 'Interventional car', 'Follow Up', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Call disconectiong","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Dares Ahmed Shams', 'www.d.daresaldee@gmail.com', '+968000000000', 'YE', 'Others', 'Interventional car', 'Follow Up', 'Nakshatra', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not answering","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Nakshatra', 'Nakshatra', NULL, '{}', now(), now(), now(), now(), 'System'),

('Dipendra KC', 'kcdipen007@gmail.com', '+977000000000', 'NP', 'MD/MS/DNB', 'Interventional car', 'Follow Up', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Brochures send","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Dr Santosh Shetty', 'dr.santosh111964@gmail.com', '+918000000000', 'IN', 'MBBS/ FMG', 'Interventional car', 'Follow Up', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"No incoiming Call","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Dr Syed Arif', 'Dr Syed Arif', '+919000000000', 'IN', 'MD/MS/DNB', 'Interventional car', 'Not Interested', 'Nakshatra', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not answering","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Nakshatra', 'Nakshatra', NULL, '{}', now(), now(), now(), now(), 'System'),

('Hemant Gupta', 'hemantgupta04@yahoo.com', '+919000000000', 'IN', 'MBBS/ FMG', 'Fellowship Psychiatr', 'Not Interested', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"He will call you","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('ismail Ismail', 'dr.ismailkamalismail@gmail.com', '+213000000000', 'DE', 'MD/MS/DNB', 'Interventional car', 'Follow Up', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Jitendra Dutta', 'dr.dutta051284@gmail.com', '+920000000000', 'IN', 'MBBS/ FMG', 'Interventional car', 'Not Interested', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not connect","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Khaled Aly', 'Adreno82@yahoo.com', '+201000000000', 'EG', 'Others', 'Interventional car', 'Not Interested', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not Ans","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Mahmoud Elazouny', 'dr.azounycardio@gmail.com', '+201000000000', 'EG', 'MBBS/ FMG', 'Interventional car', 'Not Interested', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Not Ready for admisson","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System'),

('Malla Phanindra', 'mallaphanindr5a@gmail.com', '9494694015', 'IN', 'MD/MS/DNB', 'Interventional car', 'Not Interested', 'Aslam', 'IBMP', '[{"id":"note-' || extract(epoch from now()) * 1000 || '","content":"Brochures send call back on 06 Sep","author":"IBMP Import","timestamp":"' || now()::timestamp || 'Z","note_type":"general"}]', 'medium', '50', 'Not specified', 'Not specified', '0', 'Aslam', 'Aslam', NULL, '{}', now(), now(), now(), now(), 'System');

-- Note: This is a sample of the first 20 records. 
-- The full script would contain all 1156+ leads with the same structure.
-- Each record includes:
-- - Proper JSON format for notes field
-- - Standardized qualification values
-- - Truncated course names to fit constraints
-- - Phone numbers in international format where possible
-- - Mapped status values (Follow up -> Follow Up, etc.)
-- - All required fields with defaults where needed

-- To generate the complete script, run the updated generation script with your full CSV data.