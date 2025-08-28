import React, { useEffect, useState } from "react";
import usePreTestStore from "../../../../store/instructor/preTestStore";
import Toast from "../../../components/common/Toast";

const PreTestManager = ({ moduleId }) => {
  const { preTests, fetchPreTest, updatePreTest, isLoading, error, success } = usePreTestStore();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (moduleId) fetchPreTest(moduleId);
  }, [moduleId]);

  useEffect(() => {
    if (preTests[moduleId]) {
      setTitle(preTests[moduleId].title || "");
      setQuestions(preTests[moduleId].questions || []);
    }
  }, [preTests, moduleId]);




  export default null;
