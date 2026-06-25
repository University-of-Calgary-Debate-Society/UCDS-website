import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { useDialog } from '../../context/DialogContext';

const MAILING_LIST_TYPES = {
  subscribers: {
    label: 'General Subscribers',
    fields: ['email', 'phone', 'fullName', 'firstName', 'lastName', 'languages', 'dietaryrestrictions', 'notes']
  },
  junior_high_coaches: {
    label: 'Junior High Coaches',
    fields: ['email', 'phone', 'fullName', 'firstName', 'lastName', 'institution', 'club', 'country', 'region', 'city', 'address', 'postcode', 'languages', 'dietaryrestrictions', 'notes']
  },
  high_school_coaches: {
    label: 'High School Coaches',
    fields: ['email', 'phone', 'fullName', 'firstName', 'lastName', 'institution', 'club', 'country', 'region', 'city', 'address', 'postcode', 'languages', 'dietaryrestrictions', 'notes']
  },
  junior_high_students: {
    label: 'Junior High Students',
    fields: ['email', 'phone', 'fullName', 'firstName', 'lastName', 'grade', 'institution', 'club', 'country', 'region', 'city', 'address', 'postcode', 'languages', 'dietaryrestrictions', 'volunteer', 'debater', 'judge', 'novice']
  },
  high_school_students: {
    label: 'High School Students',
    fields: ['email', 'phone', 'fullName', 'firstName', 'lastName', 'grade', 'institution', 'club', 'country', 'region', 'city', 'address', 'postcode', 'languages', 'dietaryrestrictions', 'volunteer', 'debater', 'judge', 'novice']
  },
  university_students: {
    label: 'University Students',
    fields: ['email', 'phone', 'fullName', 'firstName', 'lastName', 'grade', 'institution', 'club', 'country', 'region', 'city', 'address', 'postcode', 'languages', 'dietaryrestrictions', 'volunteer', 'debater', 'judge', 'novice', 'cusid', 'exec', 'undergraduate']
  },
  comunity_members: {
    label: 'Community Members',
    fields: ['email', 'phone', 'fullName', 'firstName', 'lastName', 'grade', 'institution', 'club', 'country', 'region', 'city', 'address', 'postcode', 'languages', 'dietaryrestrictions', 'volunteer', 'debater', 'judge', 'novice', 'cusid', 'exec', 'parent']
  },
  ucds_members: {
    label: 'UCDS Members',
    fields: ['email', 'phone', 'fullName', 'firstName', 'lastName', 'grade', 'institution', 'club', 'country', 'region', 'city', 'address', 'postcode', 'languages', 'dietaryrestrictions', 'volunteer', 'debater', 'judge', 'novice', 'cusid', 'exec', 'undergraduate', 'fees_paid', 'alumni']
  }
};

const calculateCurrentGradeAndListType = (createdAtStr, initialGrade) => {
  if (!initialGrade) return { currentGrade: '', listType: 'subscribers' };

  const signupDate = createdAtStr ? new Date(createdAtStr) : new Date();
  const currentDate = new Date();

  // Determine school year starting year (September 1st boundary)
  const getSchoolYearStart = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed: January is 0, September is 8
    return month >= 8 ? year : year - 1;
  };

  const signupSchoolYear = getSchoolYearStart(signupDate);
  const currentSchoolYear = getSchoolYearStart(currentDate);
  const schoolYearsPassed = Math.max(0, currentSchoolYear - signupSchoolYear);

  // Parse grade number
  const match = initialGrade.match(/\d+/);
  if (!match) {
    return { currentGrade: initialGrade, listType: 'subscribers' };
  }

  const gradeNum = parseInt(match[0], 10);
  const currentGradeNum = gradeNum + schoolYearsPassed;

  let listType = 'junior_high_students';
  let currentGradeStr = `Grade ${currentGradeNum}`;

  if (currentGradeNum <= 9) {
    listType = 'junior_high_students';
  } else if (currentGradeNum <= 12) {
    listType = 'high_school_students';
  } else {
    listType = 'university_students';
    currentGradeStr = `University (Graduated Grade 12 + ${currentGradeNum - 12} year(s))`;
  }

  return {
    currentGrade: currentGradeStr,
    listType
  };
};

export default function EmailCampaignManager() {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' or 'roster'

  // Firestore Data Collections
  const [drafts, setDrafts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [emailStatus, setEmailStatus] = useState('');

  // -------------------------------------------------------------
  // COMPOSER & SCHEDULER STATE
  // -------------------------------------------------------------
  const [currentDraftId, setCurrentDraftId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailPlain, setEmailPlain] = useState('');
  const [emailScheduleDate, setEmailScheduleDate] = useState('');
  const [targetLists, setTargetLists] = useState({
    subscribers: true,
    junior_high_coaches: false,
    high_school_coaches: false,
    junior_high_students: false,
    high_school_students: false,
    university_students: false,
    comunity_members: false,
    ucds_members: false
  });

  // -------------------------------------------------------------
  // SUBSCRIBER FORM STATE
  // -------------------------------------------------------------
  const [isRosterFormOpen, setIsRosterFormOpen] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState('');
  const [selectedListType, setSelectedListType] = useState('subscribers');
  
  const [formSubscribed, setFormSubscribed] = useState(true);
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formClub, setFormClub] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPostcode, setFormPostcode] = useState('');
  const [formLanguages, setFormLanguages] = useState('');
  const [formDietary, setFormDietary] = useState('');
  const [formNotes, setFormNotes] = useState('');
  
  // Boolean Fields
  const [formVolunteer, setFormVolunteer] = useState(false);
  const [formDebater, setFormDebater] = useState(false);
  const [formJudge, setFormJudge] = useState(false);
  const [formNovice, setFormNovice] = useState(false);
  const [formCusid, setFormCusid] = useState(false);
  const [formExec, setFormExec] = useState(false);
  const [formUndergraduate, setFormUndergraduate] = useState(false);
  const [formParent, setFormParent] = useState(false);
  const [formFeesPaid, setFormFeesPaid] = useState(false);
  const [formAlumni, setFormAlumni] = useState(false);

  // Extensible Custom Fields State
  const [customFields, setCustomFields] = useState([{ key: '', value: '' }]);
  const [hasManuallyToggledFeesPaid, setHasManuallyToggledFeesPaid] = useState(false);

  // Directory Search/Filters State
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterTypeFilter, setRosterTypeFilter] = useState('all');
  const [rosterStatusFilter, setRosterStatusFilter] = useState('all');

  // -------------------------------------------------------------
  // AUTH TRACKER
  // -------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setAuthInitialized(true);
      if (authInitialized && !user) {
        navigate('/executive');
      }
    });
    return () => unsubscribe();
  }, [navigate, authInitialized]);

  // -------------------------------------------------------------
  // DATABASE FETCHERS
  // -------------------------------------------------------------
  const fetchDrafts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'drafts'));
      setDrafts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching drafts", err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'schedules'));
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching schedules", err);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'subscribers'));
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const mapped = raw.map(s => {
        // Save signup baselines
        s.signupGrade = s.grade;
        s.signupListType = s.listType;

        // Resolve dynamic progression for students
        if (s.listType === 'junior_high_students' || s.listType === 'high_school_students' || s.listType === 'university_students') {
          const { currentGrade, listType } = calculateCurrentGradeAndListType(s.createdAt, s.grade);
          s.grade = currentGrade;
          s.listType = listType;
          s.lists = [listType];
        }
        return s;
      });
      setSubscribers(mapped);
    } catch (err) {
      console.error("Error fetching subscribers", err);
    }
  };

  const fetchLedger = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'ledger'));
      setLedgerTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching ledger transactions", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDrafts();
      fetchCampaigns();
      fetchSubscribers();
      fetchLedger();
    }
  }, [isLoggedIn]);

  // -------------------------------------------------------------
  // LEDGER FEE AUTO-MATCHING RULE
  // -------------------------------------------------------------
  const checkLedgerForFeesPaid = useCallback((emailVal, firstNameVal, lastNameVal, fullNameVal) => {
    const email = (emailVal || '').trim().toLowerCase();
    const firstName = (firstNameVal || '').trim().toLowerCase();
    const lastName = (lastNameVal || '').trim().toLowerCase();
    const fullName = (fullNameVal || (firstNameVal && lastNameVal ? `${firstNameVal} ${lastNameVal}` : '')).trim().toLowerCase();

    if (!email && !firstName && !lastName && !fullName) return false;

    return ledgerTransactions.some(tx => {
      // Must be a deposit transaction
      if (!tx.deposit) return false;

      const sender = (tx.sender || '').trim().toLowerCase();
      const desc = (tx.description || '').trim().toLowerCase();

      // Check if sender matches name
      const senderMatches = (fullName && sender === fullName) ||
                            (firstName && lastName && sender.includes(firstName) && sender.includes(lastName));

      // Check if description matches email or name
      const descMatches = (email && desc.includes(email)) ||
                           (fullName && desc.includes(fullName)) ||
                           (firstName && lastName && desc.includes(firstName) && desc.includes(lastName));

      return senderMatches || descMatches;
    });
  }, [ledgerTransactions]);

  // Watch fields and trigger automated payment validation
  useEffect(() => {
    if (selectedListType === 'ucds_members' && !hasManuallyToggledFeesPaid) {
      const matched = checkLedgerForFeesPaid(formEmail, formFirstName, formLastName, formFullName);
      if (matched) {
        setFormFeesPaid(true);
      }
    }
  }, [formEmail, formFirstName, formLastName, formFullName, selectedListType, checkLedgerForFeesPaid, hasManuallyToggledFeesPaid]);

  // -------------------------------------------------------------
  // DRAFT PREVIEW & LOAD
  // -------------------------------------------------------------
  const handlePreviewInNewWindow = () => {
    if (!emailTemplate.trim()) {
      alert("Please compose some HTML template content to preview.");
      return;
    }
    const previewWindow = window.open('', '_blank', 'width=850,height=700');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Preview: ${emailSubject || 'Draft'}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
                margin: 0;
                padding: 2.5rem;
                background-color: #f3f4f6;
                color: #1f2937;
              }
              .container {
                max-width: 650px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                overflow: hidden;
                border: 1px solid #e5e7eb;
              }
              .header {
                background: #112854;
                color: #ffffff;
                padding: 1.5rem 2rem;
                text-align: center;
              }
              .content {
                padding: 2rem;
                line-height: 1.6;
              }
              .footer {
                padding: 1.5rem 2rem;
                background: #f9fafb;
                border-top: 1px solid #f3f4f6;
                font-size: 0.8rem;
                color: #6b7280;
                text-align: center;
              }
              .subject-header {
                background: #e2e8f0;
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
                color: #475569;
                border-bottom: 1px solid #cbd5e1;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="subject-header">Subject: ${emailSubject || '(No Subject)'}</div>
              <div class="content">
                ${emailTemplate}
              </div>
              <div class="footer">
                This email was sent by the University of Calgary Debate Society.<br>
                <a href="#/connect/unsubscribe" style="color: #2563eb; text-decoration: none;">Unsubscribe from this mailing list</a>
              </div>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    } else {
      alert("Unable to open a new tab. Please allow popups for this site.");
    }
  };

  const handleLoadDraft = (draft) => {
    setCurrentDraftId(draft.id);
    setEmailSubject(draft.subject || '');
    setEmailTemplate(draft.templateHtml || '');
    setEmailPlain(draft.plainText || '');
    setEmailStatus(`Loaded draft: "${draft.subject}"`);
    setTimeout(() => setEmailStatus(""), 3000);
  };

  const handleSaveDraft = async () => {
    if (!emailSubject.trim()) {
      alert("Please enter a subject line to save the draft.");
      return;
    }

    setEmailStatus("Saving draft...");
    try {
      const payload = {
        subject: emailSubject.trim(),
        templateHtml: emailTemplate,
        plainText: emailPlain,
        updatedAt: new Date().toISOString()
      };

      if (currentDraftId) {
        await updateDoc(doc(db, 'drafts', currentDraftId), payload);
        setEmailStatus("Draft updated successfully.");
      } else {
        const ref = await addDoc(collection(db, 'drafts'), payload);
        setCurrentDraftId(ref.id);
        setEmailStatus("Draft created successfully.");
      }
      fetchDrafts();
      setTimeout(() => setEmailStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setEmailStatus("Failed to save draft.");
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!await confirm("Are you sure you want to delete this draft?")) return;
    try {
      await deleteDoc(doc(db, 'drafts', id));
      if (currentDraftId === id) {
        setCurrentDraftId('');
        setEmailSubject('');
        setEmailTemplate('');
        setEmailPlain('');
      }
      setEmailStatus("Draft deleted.");
      fetchDrafts();
      setTimeout(() => setEmailStatus(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // RECIPIENT COUNT CALCULATION
  // -------------------------------------------------------------
  const getActiveRecipientsForSelection = () => {
    const selectedTypes = Object.keys(targetLists).filter(key => targetLists[key]);
    if (selectedTypes.length === 0) return [];

    const matched = subscribers.filter(s => {
      const isSubscribed = s.subscribed !== undefined ? s.subscribed : s.active;
      if (!isSubscribed) return false;

      const type = s.listType || 'subscribers';
      return selectedTypes.includes(type) || s.lists?.some(l => selectedTypes.includes(l));
    });

    const seen = new Set();
    return matched.filter(s => {
      if (!s.email) return false;
      const emailLower = s.email.toLowerCase().trim();
      if (seen.has(emailLower)) return false;
      seen.add(emailLower);
      return true;
    });
  };

  const handleScheduleSend = async (e) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailTemplate.trim()) {
      alert("Subject and HTML template body are required.");
      return;
    }
    if (!emailScheduleDate) {
      alert("Please select a scheduled sending date and time.");
      return;
    }

    const selectedTypes = Object.keys(targetLists).filter(key => targetLists[key]);
    if (selectedTypes.length === 0) {
      alert("Please select at least one target mailing list.");
      return;
    }

    const recipientsList = getActiveRecipientsForSelection();
    if (recipientsList.length === 0) {
      alert("There are no active subscribed recipients in the selected mailing lists.");
      return;
    }

    setEmailStatus("Scheduling campaign...");
    try {
      const recipientPayloads = recipientsList.map(s => ({
        email: s.email,
        name: s.fullName || (s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : '') || ''
      }));

      await addDoc(collection(db, 'schedules'), {
        subject: emailSubject.trim(),
        templateHtml: emailTemplate,
        plainText: emailPlain,
        targetList: selectedTypes.join(', '),
        targetLists: selectedTypes,
        scheduledAt: new Date(emailScheduleDate).toISOString(),
        status: 'pending',
        recipients: recipientPayloads,
        baseUnsubscribeLink: 'https://ucds.ca/#/connect/unsubscribe',
        createdAt: new Date().toISOString()
      });

      setEmailStatus("Campaign successfully scheduled!");
      setEmailScheduleDate('');
      fetchCampaigns();
      setTimeout(() => setEmailStatus(""), 4000);
    } catch (err) {
      console.error(err);
      setEmailStatus("Failed to schedule campaign.");
    }
  };

  const handleCancelCampaign = async (id) => {
    if (!await confirm("Are you sure you want to cancel this scheduled campaign?")) return;
    try {
      await deleteDoc(doc(db, 'schedules', id));
      fetchCampaigns();
      alert("Campaign cancelled.");
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // SUBSCRIBER DIRECTORY / ROSTER MUTATIONS
  // -------------------------------------------------------------
  const handleResetRosterForm = () => {
    setCurrentMemberId('');
    setSelectedListType('subscribers');
    setFormSubscribed(true);
    setFormEmail('');
    setFormPhone('');
    setFormFullName('');
    setFormFirstName('');
    setFormLastName('');
    setFormGrade('');
    setFormInstitution('');
    setFormClub('');
    setFormCountry('');
    setFormRegion('');
    setFormCity('');
    setFormAddress('');
    setFormPostcode('');
    setFormLanguages('');
    setFormDietary('');
    setFormNotes('');
    setFormVolunteer(false);
    setFormDebater(false);
    setFormJudge(false);
    setFormNovice(false);
    setFormCusid(false);
    setFormExec(false);
    setFormUndergraduate(false);
    setFormParent(false);
    setFormFeesPaid(false);
    setFormAlumni(false);
    setCustomFields([{ key: '', value: '' }]);
    setHasManuallyToggledFeesPaid(false);
    setIsRosterFormOpen(false);
  };

  const handleEditMember = (member) => {
    setCurrentMemberId(member.id);
    setSelectedListType(member.signupListType || member.listType || 'subscribers');
    setFormSubscribed(member.subscribed !== undefined ? member.subscribed : (member.active ?? true));
    setFormEmail(member.email || '');
    setFormPhone(member.phone || member.phoneNumber || '');
    setFormFullName(member.fullName || '');
    setFormFirstName(member.firstName || '');
    setFormLastName(member.lastName || '');
    setFormGrade(member.signupGrade || member.grade || '');
    setFormInstitution(member.institution || '');
    setFormClub(member.club || '');
    setFormCountry(member.country || '');
    setFormRegion(member.region || '');
    setFormCity(member.city || '');
    setFormAddress(member.address || '');
    setFormPostcode(member.postcode || '');
    setFormLanguages(Array.isArray(member.languages) ? member.languages.join(', ') : (member.languages || ''));
    setFormDietary(member.dietaryrestrictions || '');
    setFormNotes(member.notes || '');

    // Boolean fields
    setFormVolunteer(!!member.volunteer);
    setFormDebater(!!member.debater);
    setFormJudge(!!member.judge);
    setFormNovice(!!member.novice);
    setFormCusid(!!member.cusid);
    setFormExec(!!member.exec);
    setFormUndergraduate(!!member.undergraduate);
    setFormParent(!!member.parent);
    setFormFeesPaid(!!member.fees_paid);
    setFormAlumni(!!member.alumni);

    // Extract custom fields (attributes not in standard lists)
    const standardKeys = [
      'listType', 'subscribed', 'active', 'email', 'phone', 'phoneNumber', 'fullName', 'firstName', 'lastName',
      'grade', 'institution', 'club', 'country', 'region', 'city', 'address', 'postcode',
      'languages', 'dietaryrestrictions', 'notes', 'volunteer', 'debater', 'judge',
      'novice', 'cusid', 'exec', 'undergraduate', 'parent', 'fees_paid', 'alumni',
      'id', 'createdAt', 'updatedAt', 'lists'
    ];

    const custom = [];
    Object.keys(member).forEach(key => {
      if (!standardKeys.includes(key)) {
        custom.push({ key, value: String(member[key]) });
      }
    });

    setCustomFields(custom.length > 0 ? custom : [{ key: '', value: '' }]);
    setHasManuallyToggledFeesPaid(true); // Stop auto matching overwrites on load
    setIsRosterFormOpen(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!formEmail.trim() || !formFirstName.trim() || !formLastName.trim()) {
      alert("Email, First Name, and Last Name are required fields.");
      return;
    }

    const targetListSchema = MAILING_LIST_TYPES[selectedListType];
    const payload = {
      listType: selectedListType,
      subscribed: formSubscribed,
      active: formSubscribed, // compatibility
      email: formEmail.trim(),
      phone: formPhone.trim(),
      fullName: formFullName.trim() || `${formFirstName.trim()} ${formLastName.trim()}`,
      firstName: formFirstName.trim(),
      lastName: formLastName.trim(),
      languages: formLanguages ? formLanguages.split(',').map(l => l.trim()).filter(Boolean) : [],
      dietaryrestrictions: formDietary.trim(),
      notes: formNotes.trim(),
      updatedAt: new Date().toISOString(),
      lists: [selectedListType] // compatibility
    };

    // Conditionally write schemas based on configuration
    if (targetListSchema.fields.includes('grade')) payload.grade = formGrade.trim();
    if (targetListSchema.fields.includes('institution')) payload.institution = formInstitution.trim();
    if (targetListSchema.fields.includes('club')) payload.club = formClub.trim();
    if (targetListSchema.fields.includes('country')) payload.country = formCountry.trim();
    if (targetListSchema.fields.includes('region')) payload.region = formRegion.trim();
    if (targetListSchema.fields.includes('city')) payload.city = formCity.trim();
    if (targetListSchema.fields.includes('address')) payload.address = formAddress.trim();
    if (targetListSchema.fields.includes('postcode')) payload.postcode = formPostcode.trim();

    // Boolean fields
    if (targetListSchema.fields.includes('volunteer')) payload.volunteer = !!formVolunteer;
    if (targetListSchema.fields.includes('debater')) payload.debater = !!formDebater;
    if (targetListSchema.fields.includes('judge')) payload.judge = !!formJudge;
    if (targetListSchema.fields.includes('novice')) payload.novice = !!formNovice;
    if (targetListSchema.fields.includes('cusid')) payload.cusid = !!formCusid;
    if (targetListSchema.fields.includes('exec')) payload.exec = !!formExec;
    if (targetListSchema.fields.includes('undergraduate')) payload.undergraduate = !!formUndergraduate;
    if (targetListSchema.fields.includes('parent')) payload.parent = !!formParent;
    if (targetListSchema.fields.includes('fees_paid')) payload.fees_paid = !!formFeesPaid;
    if (targetListSchema.fields.includes('alumni')) payload.alumni = !!formAlumni;

    // Attach extensible custom fields
    customFields.forEach(field => {
      if (field.key.trim()) {
        payload[field.key.trim()] = field.value;
      }
    });

    try {
      if (currentMemberId) {
        await updateDoc(doc(db, 'subscribers', currentMemberId), payload);
        setEmailStatus("Subscriber record updated successfully!");
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'subscribers'), payload);
        setEmailStatus("Subscriber successfully added to the directory!");
      }
      handleResetRosterForm();
      fetchSubscribers();
      setTimeout(() => setEmailStatus(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to write subscriber data: " + err.message);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!await confirm("Are you sure you want to delete this subscriber?")) return;
    try {
      await deleteDoc(doc(db, 'subscribers', id));
      setEmailStatus("Subscriber deleted.");
      fetchSubscribers();
      setTimeout(() => setEmailStatus(""), 3000);
    } catch (err) {
      console.error("Error deleting member", err);
    }
  };

  // Custom Fields Handler
  const handleAddCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const handleRemoveCustomField = (index) => {
    const updated = customFields.filter((_, idx) => idx !== index);
    setCustomFields(updated.length > 0 ? updated : [{ key: '', value: '' }]);
  };

  const handleCustomFieldChange = (index, part, val) => {
    const updated = [...customFields];
    updated[index][part] = val;
    setCustomFields(updated);
  };

  // -------------------------------------------------------------
  // FILTERED SUBSCRIBER LISTS
  // -------------------------------------------------------------
  const getFilteredRoster = () => {
    return subscribers.filter(s => {
      // 1. Search Query
      const queryStr = rosterSearch.toLowerCase().trim();
      const name = (s.fullName || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const phone = (s.phone || s.phoneNumber || '').toLowerCase();
      const matchSearch = !queryStr || name.includes(queryStr) || email.includes(queryStr) || phone.includes(queryStr);

      // 2. Type Filter
      const listType = s.listType || 'subscribers';
      const matchType = rosterTypeFilter === 'all' || listType === rosterTypeFilter;

      // 3. Status Filter
      const isSubscribed = s.subscribed !== undefined ? s.subscribed : s.active;
      const matchStatus = rosterStatusFilter === 'all' || 
                          (rosterStatusFilter === 'subscribed' && isSubscribed) || 
                          (rosterStatusFilter === 'unsubscribed' && !isSubscribed);

      return matchSearch && matchType && matchStatus;
    });
  };

  if (!authInitialized || !isLoggedIn) {
    return (
      <main>
        <section className="section" style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>Redirecting to portal...</p>
        </section>
      </main>
    );
  }

  const activeRecipientsCount = getActiveRecipientsForSelection().length;
  const filteredRoster = getFilteredRoster();

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="exec-card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '1.25rem', padding: '3rem 2.5rem', color: '#ffffff', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)', maxWidth: '1200px', margin: '4rem auto', textAlign: 'left' }}>
            
            {/* Header banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2.25rem', color: '#ffffff', margin: '0 0 0.25rem', fontWeight: 800 }}>Campaign & Directory Manager</h1>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>Send campaigns across lists, save templates, and manage subscribers.</p>
              </div>
              <Link to="/executive" className="exec-btn exec-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}>
                Back to Dashboard
              </Link>
            </div>

            {/* Alert / Notification banner */}
            {emailStatus && (
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.75rem 1.25rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1.5rem', color: '#93c5fd' }}>
                ℹ️ {emailStatus}
              </div>
            )}

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
              <button
                onClick={() => setActiveTab('campaigns')}
                style={{
                  background: activeTab === 'campaigns' ? '#2563eb' : 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.75rem',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  transition: 'background 0.2s'
                }}
              >
                Campaigns & Composer
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                style={{
                  background: activeTab === 'roster' ? '#2563eb' : 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.75rem',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  transition: 'background 0.2s'
                }}
              >
                Subscriber Directory ({subscribers.length})
              </button>
            </div>

            {/* TAB CONTENT: CAMPAIGN COMPOSER */}
            {activeTab === 'campaigns' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '2rem' }}>
                
                {/* Composer Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.75rem' }}>
                    <h4 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>Email Composer</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      
                      {/* Select Draft Dropdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Select From Drafts</label>
                        <select
                          value={currentDraftId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setCurrentDraftId('');
                              setEmailSubject('');
                              setEmailTemplate('');
                              setEmailPlain('');
                            } else {
                              const found = drafts.find(d => d.id === val);
                              if (found) handleLoadDraft(found);
                            }
                          }}
                          className="select-input"
                          style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem' }}
                        >
                          <option value="">-- Start from scratch / Select saved draft --</option>
                          {drafts.map(d => (
                            <option key={d.id} value={d.id}>{d.subject}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Subject Line</label>
                        <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="text-input" placeholder="🏆 Calgary Summer Cup 2026 - Register Now!" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>HTML Template Content</label>
                          <button
                            type="button"
                            onClick={handlePreviewInNewWindow}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              color: '#60a5fa',
                              padding: '2px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            💻 Preview Template in New Window
                          </button>
                        </div>
                        <textarea value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} className="textarea-input textarea-mono" placeholder="<h1>Hi {{name}}</h1>..." rows="9" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace', outline: 'none' }} />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Plain Text Fallback Body</label>
                        <textarea value={emailPlain} onChange={(e) => setEmailPlain(e.target.value)} className="textarea-input" placeholder="Hi {{name}}, ..." rows="4" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                        <button onClick={handleSaveDraft} className="exec-btn exec-btn-primary" style={{ padding: '10px 24px', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>
                          {currentDraftId ? 'Update Draft' : 'Save New Draft'}
                        </button>
                        {currentDraftId && (
                          <button onClick={() => { setCurrentDraftId(''); setEmailSubject(''); setEmailTemplate(''); setEmailPlain(''); }} className="exec-btn exec-btn-secondary" style={{ padding: '10px 20px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer', fontSize: '0.95rem' }}>
                            Clear Composer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Form */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.75rem' }}>
                    <h4 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>Schedule Campaign Dispatch</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Target Mailing Lists (Select any combination)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {Object.keys(MAILING_LIST_TYPES).map(key => (
                          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={targetLists[key]}
                              onChange={(e) => setTargetLists({ ...targetLists, [key]: e.target.checked })}
                              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                            />
                            {MAILING_LIST_TYPES[key].label}
                          </label>
                        ))}
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                        🎯 Estimated Recipients: <strong style={{ color: '#60a5fa' }}>{activeRecipientsCount}</strong> unique subscribed members (duplicates auto-resolved).
                      </div>
                    </div>

                    <form onSubmit={handleScheduleSend} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem', alignItems: 'end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>Sending Schedule (Local Time)</label>
                        <input type="datetime-local" value={emailScheduleDate} onChange={(e) => setEmailScheduleDate(e.target.value)} className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px', borderRadius: '4px', fontSize: '0.95rem' }} required />
                      </div>
                      <button type="submit" className="exec-btn exec-btn-primary" style={{ padding: '10px', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>Schedule Dispatch</button>
                    </form>
                  </div>
                </div>

                {/* Right Column: Drafts & Campaigns lists */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>Saved Drafts</h4>
                    {drafts.length === 0 ? (
                      <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0 }}>No drafts saved.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {drafts.map(d => (
                          <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ cursor: 'pointer', color: '#60a5fa', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} onClick={() => handleLoadDraft(d)}>
                              {d.subject}
                            </span>
                            <button onClick={() => handleDeleteDraft(d.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete draft">&times;</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1.25rem', color: '#93c5fd', fontSize: '1.15rem', fontWeight: 700 }}>Campaign Dispatches</h4>
                    {campaigns.length === 0 ? (
                      <p style={{ fontSize: '0.95rem', color: '#94a3b8', margin: 0 }}>No campaigns scheduled.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {campaigns.map(c => (
                          <li key={c.id} style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', lineHeight: '1.4', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                              <span style={{ color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={c.subject}>{c.subject}</span>
                              <span style={{ color: c.status === 'pending' ? '#eab308' : c.status === 'sent' ? '#22c55e' : '#ef4444' }}>{c.status.toUpperCase()}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                              Targets: <span style={{ color: '#cbd5e1' }}>{c.targetList}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Scheduled: {new Date(c.scheduledAt).toLocaleString()}
                            </div>
                            {c.status === 'pending' && (
                              <button onClick={() => handleCancelCampaign(c.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', borderRadius: '4px', fontSize: '0.75rem', padding: '3px 8px', marginTop: '8px', cursor: 'pointer' }}>Cancel Schedule</button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: SUBSCRIBER ROSTER DIRECTORY */}
            {activeTab === 'roster' && (
              <div>
                {/* Form overlay/expandable drawer */}
                {isRosterFormOpen ? (
                  <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2rem', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, color: '#93c5fd', fontSize: '1.4rem', fontWeight: 'bold' }}>
                        {currentMemberId ? '✏️ Edit Subscriber Profile' : '👤 Add New Subscriber'}
                      </h3>
                      <button onClick={handleResetRosterForm} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1.75rem' }}>&times;</button>
                    </div>

                    <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* Top Config Row: List Type and Subscription Status */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>Target Mailing List Type *</label>
                          <select
                            value={selectedListType}
                            onChange={(e) => setSelectedListType(e.target.value)}
                            className="select-input"
                            style={{ background: 'rgba(0,0,0,0.3)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px', borderRadius: '6px', fontSize: '0.95rem' }}
                          >
                            {Object.keys(MAILING_LIST_TYPES).map(key => (
                              <option key={key} value={key}>{MAILING_LIST_TYPES[key].label}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: '#e2e8f0', cursor: 'pointer', marginTop: '1.25rem' }}>
                            <input
                              type="checkbox"
                              checked={formSubscribed}
                              onChange={(e) => setFormSubscribed(e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            Subscribed to Mailing List
                          </label>
                        </div>
                      </div>

                      {/* General Fields: Email, Phone, Names */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Email Address *</label>
                          <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="name@example.com" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Phone Number</label>
                          <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="403-555-0199" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Full Name (Optional)</label>
                          <input type="text" value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="Johnathan Doe" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>First Name *</label>
                          <input type="text" value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="John" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} required />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Last Name *</label>
                          <input type="text" value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="Doe" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} required />
                        </div>
                      </div>

                      {/* Location and Affiliation (Conditional Fields) */}
                      {(selectedListType !== 'subscribers') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                            {MAILING_LIST_TYPES[selectedListType].fields.includes('grade') && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Grade Level</label>
                                <input type="text" value={formGrade} onChange={(e) => setFormGrade(e.target.value)} placeholder="Grade 11 / Undergrad Yr 2" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                              </div>
                            )}
                            {MAILING_LIST_TYPES[selectedListType].fields.includes('institution') && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Institution / School</label>
                                <input type="text" value={formInstitution} onChange={(e) => setFormInstitution(e.target.value)} placeholder="University of Calgary" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                              </div>
                            )}
                            {MAILING_LIST_TYPES[selectedListType].fields.includes('club') && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Club / Society</label>
                                <input type="text" value={formClub} onChange={(e) => setFormClub(e.target.value)} placeholder="UCDS" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Country</label>
                              <input type="text" value={formCountry} onChange={(e) => setFormCountry(e.target.value)} placeholder="Canada" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Region / Province</label>
                              <input type="text" value={formRegion} onChange={(e) => setFormRegion(e.target.value)} placeholder="Alberta" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>City</label>
                              <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="Calgary" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Street Address</label>
                              <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="2500 University Dr NW" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Postcode</label>
                              <input type="text" value={formPostcode} onChange={(e) => setFormPostcode(e.target.value)} placeholder="T2N 1N4" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Languages and Dietary (List & Metadata always available) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Languages (comma-separated list)</label>
                          <input type="text" value={formLanguages} onChange={(e) => setFormLanguages(e.target.value)} placeholder="English, French, Spanish" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Dietary Restrictions</label>
                          <input type="text" value={formDietary} onChange={(e) => setFormDietary(e.target.value)} placeholder="Vegetarian / Nut allergy" className="text-input" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '6px' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Internal Notes</label>
                        <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notes about volunteer availability, payment details..." rows="2" style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' }} />
                      </div>

                      {/* Checkbox Attributes (Boolean Indicators) */}
                      {((MAILING_LIST_TYPES[selectedListType].fields.some(f => ['volunteer', 'debater', 'judge', 'novice', 'cusid', 'exec', 'undergraduate', 'parent', 'fees_paid', 'alumni'].includes(f)))) && (
                        <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.25rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 'bold', display: 'block', marginBottom: '0.75rem' }}>Member Roles & Attributes</span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px 20px' }}>
                            
                            {MAILING_LIST_TYPES[selectedListType].fields.includes('volunteer') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formVolunteer} onChange={(e) => setFormVolunteer(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                Volunteer
                              </label>
                            )}

                            {MAILING_LIST_TYPES[selectedListType].fields.includes('debater') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formDebater} onChange={(e) => setFormDebater(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                Debater
                              </label>
                            )}

                            {MAILING_LIST_TYPES[selectedListType].fields.includes('judge') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formJudge} onChange={(e) => setFormJudge(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                Judge
                              </label>
                            )}

                            {MAILING_LIST_TYPES[selectedListType].fields.includes('novice') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formNovice} onChange={(e) => setFormNovice(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                Novice
                              </label>
                            )}

                            {MAILING_LIST_TYPES[selectedListType].fields.includes('cusid') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formCusid} onChange={(e) => setFormCusid(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                CUSID Member
                              </label>
                            )}

                            {MAILING_LIST_TYPES[selectedListType].fields.includes('exec') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formExec} onChange={(e) => setFormExec(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                Executive Officer
                              </label>
                            )}

                            {MAILING_LIST_TYPES[selectedListType].fields.includes('undergraduate') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formUndergraduate} onChange={(e) => setFormUndergraduate(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                Undergraduate Student
                              </label>
                            )}

                            {MAILING_LIST_TYPES[selectedListType].fields.includes('parent') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formParent} onChange={(e) => setFormParent(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                Parent
                              </label>
                            )}

                            {MAILING_LIST_TYPES[selectedListType].fields.includes('alumni') && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formAlumni} onChange={(e) => setFormAlumni(e.target.checked)} style={{ width: '15px', height: '15px' }} />
                                Alumni
                              </label>
                            )}

                            {/* UCDS MEMBERSHIP FEE CHECK (WITH LEDGER AUTO-MATCHING FEEDBACK) */}
                            {MAILING_LIST_TYPES[selectedListType].fields.includes('fees_paid') && (
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={formFeesPaid}
                                    onChange={(e) => {
                                      setFormFeesPaid(e.target.checked);
                                      setHasManuallyToggledFeesPaid(true); // Stop overriding manually checked box
                                    }}
                                    style={{ width: '15px', height: '15px' }}
                                  />
                                  Fees Paid
                                </label>
                                {checkLedgerForFeesPaid(formEmail, formFirstName, formLastName, formFullName) && (
                                  <span style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    ✓ Auto-matched in ledger
                                  </span>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      )}

                      {/* Extensible Custom Fields Section */}
                      <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 'bold' }}>Custom Extensible Fields (Saved dynamically at root)</span>
                          <button
                            type="button"
                            onClick={handleAddCustomField}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              color: '#60a5fa',
                              padding: '3px 10px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            + Add Field
                          </button>
                        </div>

                        {customFields.map((field, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => handleCustomFieldChange(idx, 'key', e.target.value)}
                              placeholder="Field Name (e.g. graduationYear)"
                              className="text-input"
                              style={{ background: 'rgba(0,0,0,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleCustomFieldChange(idx, 'value', e.target.value)}
                              placeholder="Field Value (e.g. 2027)"
                              className="text-input"
                              style={{ background: 'rgba(0,0,0,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(idx)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.25rem', cursor: 'pointer' }}
                              title="Delete Field"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                        <button type="submit" className="exec-btn exec-btn-primary" style={{ padding: '10px 28px', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                          {currentMemberId ? 'Save Changes' : 'Create Subscriber'}
                        </button>
                        <button type="button" onClick={handleResetRosterForm} className="exec-btn exec-btn-secondary" style={{ padding: '10px 24px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer', fontSize: '0.95rem' }}>
                          Cancel
                        </button>
                      </div>

                    </form>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => {
                        handleResetRosterForm();
                        setIsRosterFormOpen(true);
                      }}
                      className="exec-btn exec-btn-primary"
                      style={{ padding: '0.75rem 2rem', borderRadius: '999px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Subscriber / Person
                    </button>
                  </div>
                )}

                {/* Directory Controls and Search Filters */}
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Search Directory</label>
                    <input
                      type="text"
                      placeholder="Search name, email or phone..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      className="text-input"
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Filter by List Type</label>
                    <select
                      value={rosterTypeFilter}
                      onChange={(e) => setRosterTypeFilter(e.target.value)}
                      className="select-input"
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)', padding: '8px', borderRadius: '4px', fontSize: '0.9rem' }}
                    >
                      <option value="all">All Lists</option>
                      {Object.keys(MAILING_LIST_TYPES).map(key => (
                        <option key={key} value={key}>{MAILING_LIST_TYPES[key].label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Subscription Status</label>
                    <select
                      value={rosterStatusFilter}
                      onChange={(e) => setRosterStatusFilter(e.target.value)}
                      className="select-input"
                      style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.12)', padding: '8px', borderRadius: '4px', fontSize: '0.9rem' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="subscribed">Subscribed</option>
                      <option value="unsubscribed">Unsubscribed</option>
                    </select>
                  </div>
                </div>

                {/* Subscribers Roster List Table */}
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                  {filteredRoster.length === 0 ? (
                    <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#cbd5e1', background: 'rgba(0,0,0,0.15)' }}>
                      🔍 No subscribers match the selected filter criteria.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#ffffff', background: 'rgba(0,0,0,0.1)' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 16px' }}>Subscriber Name</th>
                          <th style={{ padding: '12px 16px' }}>Contact Information</th>
                          <th style={{ padding: '12px 16px' }}>Mailing List Type</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoster.map(s => {
                          const isSubscribed = s.subscribed !== undefined ? s.subscribed : s.active;
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontWeight: 'bold' }}>{s.fullName || `${s.firstName || ''} ${s.lastName || ''}`}</div>
                                {(s.grade) && (
                                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    🎓 {s.grade}
                                    {s.signupGrade && s.signupGrade !== s.grade && (
                                      <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                        (registered as {s.signupGrade})
                                      </span>
                                    )}
                                  </div>
                                )}
                                {(s.listType === 'ucds_members') && (
                                  <span style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: s.fees_paid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: s.fees_paid ? '#4ade80' : '#f87171',
                                    border: s.fees_paid ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                    marginTop: '4px',
                                    display: 'inline-block'
                                  }}>
                                    {s.fees_paid ? 'Fees Paid' : 'Fees Pending'}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ color: '#93c5fd' }}>{s.email}</div>
                                {s.phone && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>📞 {s.phone}</div>}
                              </td>
                              <td style={{ padding: '12px 16px', textTransform: 'capitalize', color: '#cbd5e1' }}>
                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  {MAILING_LIST_TYPES[s.listType || 'subscribers']?.label || 'General Subscribers'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  background: isSubscribed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: isSubscribed ? '#22c55e' : '#ef4444',
                                  border: isSubscribed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                                }}>
                                  {isSubscribed ? 'ACTIVE' : 'UNSUBSCRIBED'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button onClick={() => handleEditMember(s)} className="exec-btn exec-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>Edit</button>
                                  <button onClick={() => handleDeleteMember(s.id)} className="exec-btn exec-btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', background: '#dc2626', border: 'none' }}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </main>
  );
}

